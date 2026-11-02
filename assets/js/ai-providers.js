/**
 * QUANT AI - Unified AI Provider Layer (Strategy Pattern)
 * Supports: OpenAI, Google Gemini, Anthropic Claude, OpenRouter, Local Ollama
 */

class BaseProvider {
    constructor(config) {
        this.baseUrl = config.baseUrl || '';
        this.apiKey = config.apiKey || '';
        this.model = config.model || '';
    }

    async sendMessage(messages, systemInstruction) {
        throw new Error('sendMessage must be implemented by Provider');
    }
}

// ─── Agent Tool Declarations ──────────────────────────────
const QUANT_TOOLS_GEMINI = [{
    functionDeclarations: [
        {
            name: "list_files",
            description: "List files and subdirectories in the user's active local workspace.",
            parameters: {
                type: "OBJECT",
                properties: {
                    max_depth: { type: "INTEGER", description: "Maximum directory depth level (default 3)." }
                }
            }
        },
        {
            name: "read_file",
            description: "Read contents of a local file in workspace.",
            parameters: {
                type: "OBJECT",
                properties: {
                    path: { type: "STRING", description: "Relative file path (e.g. src/main.cpp)" }
                },
                required: ["path"]
            }
        },
        {
            name: "write_file",
            description: "Create or overwrite a local file in workspace with text content.",
            parameters: {
                type: "OBJECT",
                properties: {
                    path: { type: "STRING", description: "Relative target file path" },
                    content: { type: "STRING", description: "Text content to write into file" }
                },
                required: ["path", "content"]
            }
        },
        {
            name: "exec_command",
            description: "Execute a bash shell command in the local workspace terminal.",
            parameters: {
                type: "OBJECT",
                properties: {
                    command: { type: "STRING", description: "Command string to execute (e.g. ls -la, g++ -o app main.cpp)" }
                },
                required: ["command"]
            }
        }
    ]
}];

const QUANT_TOOLS_OPENAI = [
    {
        type: "function",
        function: {
            name: "list_files",
            description: "List files and subdirectories in workspace.",
            parameters: {
                type: "object",
                properties: { max_depth: { type: "integer" } }
            }
        }
    },
    {
        type: "function",
        function: {
            name: "read_file",
            description: "Read file contents in workspace.",
            parameters: {
                type: "object",
                properties: { path: { type: "string" } },
                required: ["path"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "write_file",
            description: "Create or write file in workspace.",
            parameters: {
                type: "object",
                properties: {
                    path: { type: "string" },
                    content: { type: "string" }
                },
                required: ["path", "content"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "exec_command",
            description: "Execute bash command in terminal.",
            parameters: {
                type: "object",
                properties: { command: { type: "string" } },
                required: ["command"]
            }
        }
    }
];

class OpenAIProvider extends BaseProvider {
    async sendMessage(messages, systemInstruction, options = {}) {
        let url = this.baseUrl ? `${this.baseUrl.replace(/\/+$/, '')}` : 'https://api.openai.com/v1';
        if (!url.endsWith('/chat/completions')) {
            url = `${url}/chat/completions`;
        }
        if (!url.startsWith('http')) {
            url = `https://${url}`;
        }
        
        const payloadMessages = [];
        if (systemInstruction) {
            payloadMessages.push({ role: 'system', content: systemInstruction });
        }
        messages.forEach(m => payloadMessages.push({ role: m.role, content: m.content }));

        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }
        if (url.includes('openrouter.ai')) {
            headers['HTTP-Referer'] = window.location.href;
            headers['X-Title'] = 'QUANT AI';
        }

        const bodyObj = {
            model: this.model || 'gpt-4o',
            messages: payloadMessages,
            // Explicit cap instead of leaving it unset: some providers (like
            // OpenRouter with certain free models) default to the model's
            // theoretical max (e.g. 65535) when max_tokens is omitted, which
            // then gets rejected by free-tier accounts that can only afford
            // a much lower ceiling. 4096 is a safe, generous default that
            // fits comfortably under typical free-tier limits.
            max_tokens: 4096
        };

        // Enable tool calling if agent is connected
        if (window.quantAgent?.status === 'connected') {
            bodyObj.tools = QUANT_TOOLS_OPENAI;
        }

        const fetchOptions = {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(bodyObj)
        };
        if (options.signal) fetchOptions.signal = options.signal;

        const res = await fetch(url, fetchOptions).catch(err => {
            if (err.name === 'AbortError') throw err;
            throw new Error(`Network failure connecting to ${url}: ${err.message}`);
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error?.message || errData.message || `[API Error ${res.status}] ${res.statusText}`);
        }

        const data = await res.json();
        const choiceMsg = data.choices?.[0]?.message;

        // Handle Tool Calls if model requested function execution
        if (choiceMsg?.tool_calls && choiceMsg.tool_calls.length > 0 && window.QuantToolRuntime) {
            payloadMessages.push(choiceMsg);

            for (const call of choiceMsg.tool_calls) {
                const fnName = call.function.name;
                const fnArgs = JSON.parse(call.function.arguments || '{}');

                if (options.onEvent) options.onEvent({ type: 'tool_start', name: fnName, args: fnArgs });
                if (options.statusCallback) {
                    options.statusCallback(`⚡ Executing Local Tool: ${fnName}...`);
                }

                let toolResult;
                try {
                    toolResult = await window.QuantToolRuntime.executeToolCall(fnName, fnArgs);
                } catch (e) {
                    toolResult = { error: e.message };
                }
                if (options.onEvent) options.onEvent({
                    type: 'tool_result', name: fnName, args: fnArgs,
                    result: toolResult, error: toolResult?.error || null
                });

                payloadMessages.push({
                    role: 'tool',
                    tool_call_id: call.id,
                    content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult)
                });
            }

            // Follow-up request to get final answer
            const followUpOptions = {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ ...bodyObj, messages: payloadMessages })
            };
            if (options.signal) followUpOptions.signal = options.signal;
            const followUpRes = await fetch(url, followUpOptions);

            if (followUpRes.ok) {
                const followUpData = await followUpRes.json();
                return followUpData.choices?.[0]?.message?.content || 'Completed local tool execution.';
            }
            const followUpError = await followUpRes.json().catch(() => ({}));
            throw new Error(followUpError.error?.message || followUpError.message || `[API Error ${followUpRes.status}] ${followUpRes.statusText}`);
        }

        return choiceMsg?.content || 'No response content.';
    }

    async transcribeAudio(audioBlob) {
        if (!this.apiKey) throw new Error('OpenAI API key is required for voice transcription.');
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        formData.append('model', 'whisper-1');

        let url = this.baseUrl ? `${this.baseUrl.replace(/\/+$/, '')}` : 'https://api.openai.com/v1';
        url = `${url.replace(/\/chat\/completions\/?$/, '')}/audio/transcriptions`;

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${this.apiKey}` },
            body: formData
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error?.message || `[Whisper Error ${res.status}]`);
        }

        const data = await res.json();
        return (data.text || '').trim();
    }
}

class GeminiProvider extends BaseProvider {
    /**
     * Streams a Gemini response using streamGenerateContent (SSE), emitting
     * granular live events via options.onEvent as they happen. This is what
     * powers the Claude-style "live typing + tool cards" UI in ChatView.js,
     * instead of silently waiting for one giant final JSON response.
     *
     * Event shapes emitted via options.onEvent(event):
     *   { type: 'text_delta', text }                        — a chunk of streamed text to append live
     *   { type: 'tool_start', name, args }                  — model is about to call a tool
     *   { type: 'tool_result', name, args, result, error }  — tool finished (error is null on success)
     *   { type: 'turn_end' }                                — current model turn fully finished
     *
     * options.statusCallback (old string-status API) is still called too,
     * for any code that hasn't moved to onEvent yet.
     */
    async sendMessage(messages, systemInstruction, options = {}) {
        let rawModel = (this.model || 'gemini-3.8-flash').trim();
        let modelName = rawModel.startsWith('models/') ? rawModel.replace('models/', '') : rawModel;
        if (!modelName) {
            modelName = 'gemini-3.8-flash';
        }

        let rawBase = (this.baseUrl || '').trim();
        let apiKey = (this.apiKey || '').trim().replace(/^["']|["']$/g, '');

        if (!apiKey) {
            throw new Error('Google Gemini API Key is missing. Please enter your API key in Settings.');
        }

        const emit = (ev) => { if (options.onEvent) options.onEvent(ev); };

        // Check if user specified OpenAI-compatible endpoint format for Gemini (e.g. googleapis.com/v1beta/openai)
        // Note: this compatibility path has no true SSE/tool-call streaming
        // support, so it stays non-streaming — it emits its whole answer as
        // a single text_delta event once it arrives.
        if (rawBase.includes('/openai')) {
            let url = rawBase;
            if (!url.endsWith('/chat/completions')) {
                url = `${url.replace(/\/+$/, '')}/chat/completions`;
            }
            if (!url.startsWith('http')) {
                url = `https://${url}`;
            }

            const payloadMessages = [];
            if (systemInstruction) {
                payloadMessages.push({ role: 'system', content: systemInstruction });
            }
            messages.forEach(m => payloadMessages.push({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.content
            }));

            const fetchOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: payloadMessages
                })
            };
            if (options.signal) fetchOptions.signal = options.signal;
            const res = await fetch(url, fetchOptions).catch(err => {
                throw new Error(`Network failure connecting to Gemini OpenAI endpoint: ${err.message}. If Google services are restricted in your region, consider using OpenRouter.`);
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                const rawMsg = Array.isArray(errData) ? errData[0]?.error?.message : (errData.error?.message || errData.error?.status);
                throw new Error(rawMsg || `[Gemini OpenAI Error ${res.status}] ${res.statusText}`);
            }

            const data = await res.json();
            const text = data.choices?.[0]?.message?.content || 'No response content from Gemini.';
            emit({ type: 'text_delta', text });
            emit({ type: 'turn_end' });
            return text;
        }

        // Native Google Generative Language REST API
        let base = rawBase || 'https://generativelanguage.googleapis.com';
        base = base.replace(/\/+$/, '');
        base = base.replace(/\/chat\/completions\/?$/, '');
        base = base.replace(/\/v1beta\/?$/, '');
        base = base.replace(/\/v1\/?$/, '');
        base = base.replace(/\/openai\/?$/, '');

        if (!base.startsWith('http')) {
            base = `https://${base}`;
        }

        // Map messages to Gemini REST format (supporting multi-modal vision images)
        const contents = messages.map(m => {
            const role = m.role === 'assistant' ? 'model' : 'user';
            const parts = [];
            const textContent = m.content || '';

            if (textContent.includes('[Attached Image Data: data:image/')) {
                const imgRegex = /\[Attached Image Data: (data:(image\/[a-zA-Z+]+);base64,([A-Za-z0-9+/=]+))\]/g;
                let match;
                let cleanText = textContent;

                while ((match = imgRegex.exec(textContent)) !== null) {
                    const mimeType = match[2];
                    const base64Data = match[3];
                    parts.push({
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Data
                        }
                    });
                }

                cleanText = cleanText.replace(/\[Attached Image Data: data:image\/[a-zA-Z+]+;base64,[A-Za-z0-9+/=]+\]/g, '').trim();
                if (cleanText) {
                    parts.unshift({ text: cleanText });
                }
            } else {
                parts.push({ text: textContent || ' ' });
            }

            if (parts.length === 0) {
                parts.push({ text: ' ' });
            }

            return { role, parts };
        });

        const bodyPayload = { contents };

        if (systemInstruction) {
            bodyPayload.systemInstruction = {
                parts: [{ text: systemInstruction }]
            };
        }

        // Attach tools if local agent is connected
        if (window.quantAgent?.status === 'connected') {
            bodyPayload.tools = QUANT_TOOLS_GEMINI;
        }

        const fallbackCandidates = ['gemini-4-argon', 'gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
        const modelsToTry = [modelName, ...fallbackCandidates.filter(m => m !== modelName)];
        let lastErrorMsg = '';

        for (const targetModel of modelsToTry) {
            // streamGenerateContent + alt=sse gives us real Server-Sent
            // Events: the response body is a stream of "data: {...}\n\n"
            // frames, each containing one incremental piece of the model's
            // output, instead of one giant JSON blob at the very end.
            const url = `${base}/v1beta/models/${targetModel}:streamGenerateContent?alt=sse`;

            try {
                let iterations = 0;
                let fullText = '';
                let httpFailed = false; // true when a non-auth HTTP error occurred — signals "try the next model", not "empty response"

                // One iteration = one streamed model turn. If a turn ends in
                // a functionCall, we run the tool, feed the result back into
                // `contents`, and stream a follow-up turn — same overall
                // shape as the old non-streaming version, but every turn is
                // now itself streamed token-by-token.
                while (iterations < 25) {
                    iterations++;

                    const reqOpts = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-goog-api-key': apiKey
                        },
                        body: JSON.stringify({
                            contents,
                            systemInstruction: bodyPayload.systemInstruction,
                            ...(bodyPayload.tools ? { tools: bodyPayload.tools } : {})
                        })
                    };
                    if (options.signal) reqOpts.signal = options.signal;

                    const res = await fetch(url, reqOpts).catch(err => {
                        if (err.name === 'AbortError') throw err;
                        throw new Error(`Network connection failed: ${err.message}`);
                    });

                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        lastErrorMsg = errData.error?.message || errData.error?.status || `[HTTP ${res.status}] ${res.statusText}`;
                        console.warn(`[QUANT Gemini Debug] Model "${targetModel}" failed with HTTP ${res.status}: ${lastErrorMsg}`);
                        if (lastErrorMsg.toLowerCase().includes('api key not valid') || res.status === 401 || res.status === 403) {
                            throw new Error(`Google API Key Invalid or Access Restricted: ${lastErrorMsg}.\n\nEnsure your key is from https://aistudio.google.com and that Google services are accessible in your network region.`);
                        }
                        httpFailed = true;
                        break; // try next candidate model
                    }

                    // ─── Parse the SSE stream frame-by-frame as bytes arrive ───
                    const reader = res.body.getReader();
                    const decoder = new TextDecoder('utf-8');
                    let sseBuffer = '';
                    let turnParts = [];       // accumulated text{} parts for this turn
                    let turnFnCall = null;    // functionCall part, if the model requests a tool
                    let sawSafetyBlock = false;
                    const processSseFrame = (frame) => {
                        const dataLine = frame.split('\n').find(line => line.startsWith('data:'));
                        if (!dataLine) return;
                        const jsonStr = dataLine.slice(5).trim();
                        if (!jsonStr) return;
                        let chunk;
                        try { chunk = JSON.parse(jsonStr); } catch { return; }
                        const candidate = chunk.candidates?.[0];
                        if (!candidate) return;
                        if (candidate.finishReason === 'SAFETY') {
                            sawSafetyBlock = true;
                            return;
                        }
                        for (const part of candidate.content?.parts || []) {
                            if (part.text) {
                                turnParts.push(part.text);
                                fullText += part.text;
                                emit({ type: 'text_delta', text: part.text });
                            } else if (part.functionCall) {
                                turnFnCall = part.functionCall;
                            }
                        }
                    };

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        sseBuffer += decoder.decode(value, { stream: true });

                        // SSE frames can use LF or CRLF line endings.
                        let frameBoundary;
                        while ((frameBoundary = /\r?\n\r?\n/.exec(sseBuffer)) !== null) {
                            const frame = sseBuffer.slice(0, frameBoundary.index);
                            sseBuffer = sseBuffer.slice(frameBoundary.index + frameBoundary[0].length);
                            processSseFrame(frame);
                        }
                    }

                    // The final SSE frame is not guaranteed to end with a blank line.
                    sseBuffer += decoder.decode();
                    if (sseBuffer.trim()) processSseFrame(sseBuffer);

                    if (sawSafetyBlock && !turnParts.length && !turnFnCall) {
                        throw new Error('Response was flagged by Gemini safety filters.');
                    }

                    // ─── No tool call this turn → the answer is complete ───
                    if (!turnFnCall || !window.QuantToolRuntime) {
                        console.warn(`[QUANT Gemini Debug] Turn ended with no tool call. turnFnCall=${!!turnFnCall}, QuantToolRuntime=${!!window.QuantToolRuntime}, fullText length=${fullText.length}`);
                        emit({ type: 'turn_end' });
                        return fullText || 'No response content from Gemini.';
                    }

                    // ─── Model requested a tool: run it, emit start+result as live events, then loop ───
                    const fnName = turnFnCall.name;
                    const fnArgs = turnFnCall.args || {};

                    emit({ type: 'tool_start', name: fnName, args: fnArgs });
                    if (options.statusCallback) {
                        options.statusCallback(`⚡ Executing Agent Tool (${fnName})...`);
                    }

                    let toolResult, toolError = null;
                    try {
                        toolResult = await window.QuantToolRuntime.executeToolCall(fnName, fnArgs);
                    } catch (e) {
                        toolResult = { error: e.message };
                        toolError = e.message;
                    }
                    emit({ type: 'tool_result', name: fnName, args: fnArgs, result: toolResult, error: toolError });

                    // Record this turn (any text + the functionCall) and the
                    // tool's response back into the running `contents` transcript.
                    contents.push({
                        role: 'model',
                        parts: [
                            ...(turnParts.length ? [{ text: turnParts.join('') }] : []),
                            { functionCall: turnFnCall }
                        ]
                    });
                    contents.push({
                        role: 'function',
                        parts: [{
                            functionResponse: {
                                name: fnName,
                                response: { name: fnName, content: toolResult }
                            }
                        }]
                    });

                    emit({ type: 'turn_end' });
                    // loop continues → streams the model's next turn
                }

                // If we broke out due to an HTTP failure, don't fall through
                // to "no response content" — go try the next candidate model
                // (or, if none are left, the final throw after the for-loop
                // will surface the real lastErrorMsg to the user).
                if (httpFailed) continue;

                // ─── Hit the tool-call iteration cap ───
                // If every one of the last iterations ended in a tool call
                // (a realistic scenario for multi-step file/agent tasks),
                // fullText can be genuinely empty here even though real work
                // was done — the model just never got a turn to write a
                // closing summary. Force exactly one more request with NO
                // tools attached, so Gemini is compelled to respond with
                // text instead of yet another function call.
                if (!fullText) {
                    const finalReqOpts = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-goog-api-key': apiKey
                        },
                        body: JSON.stringify({
                            contents,
                            systemInstruction: bodyPayload.systemInstruction
                            // intentionally no `tools` here
                        })
                    };
                    if (options.signal) finalReqOpts.signal = options.signal;

                    try {
                        const finalRes = await fetch(url, finalReqOpts);
                        if (finalRes.ok) {
                            const reader2 = finalRes.body.getReader();
                            const decoder2 = new TextDecoder('utf-8');
                            let buf2 = '';
                            while (true) {
                                const { done, value } = await reader2.read();
                                if (done) break;
                                buf2 += decoder2.decode(value, { stream: true });
                                let fEnd;
                                while ((fEnd = buf2.indexOf('\n\n')) !== -1) {
                                    const frame = buf2.slice(0, fEnd);
                                    buf2 = buf2.slice(fEnd + 2);
                                    const dLine = frame.split('\n').find(l => l.startsWith('data:'));
                                    if (!dLine) continue;
                                    const jStr = dLine.slice(5).trim();
                                    if (!jStr) continue;
                                    let ck;
                                    try { ck = JSON.parse(jStr); } catch { continue; }
                                    for (const part of ck.candidates?.[0]?.content?.parts || []) {
                                        if (typeof part.text === 'string' && part.text.length) {
                                            fullText += part.text;
                                            emit({ type: 'text_delta', text: part.text });
                                        }
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        // Ignore — we'll fall back to the summary message below.
                    }
                }

                emit({ type: 'turn_end' });
                console.warn(`[QUANT Gemini Debug] Hit iteration cap (${iterations}) with fullText length=${fullText.length}`);
                return fullText || `⚡ Completed ${iterations} tool action(s), but the model didn't return a closing summary. The actions above were still carried out.`;

            } catch (e) {
                if (e.name === 'AbortError') throw e;
                if (e.message.includes('API Key Invalid') || e.message.includes('safety filters')) {
                    throw e;
                }
                lastErrorMsg = e.message;
                // try next candidate model
            }
        }

        throw new Error(`Google Gemini Error: ${lastErrorMsg}\n\n💡 Tips:\n1. Verify your key at https://aistudio.google.com\n2. If direct Google endpoints are blocked/restricted in your region, try choosing "Custom / OpenRouter" in Settings with Base URL "https://openrouter.ai/api/v1" and model "google/gemini-flash-1.5".`);
    }

    async transcribeAudio(audioBlob) {
        let apiKey = (this.apiKey || '').trim().replace(/^["']|["']$/g, '');
        if (!apiKey) throw new Error('Google Gemini API Key is missing. Please enter your API key in Settings.');

        const base64Data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const resStr = String(reader.result || '');
                const commaIdx = resStr.indexOf(',');
                resolve(commaIdx !== -1 ? resStr.substring(commaIdx + 1) : resStr);
            };
            reader.onerror = reject;
            reader.readAsDataURL(audioBlob);
        });

        const rawMime = audioBlob.type || 'audio/webm';
        const mimeType = rawMime.split(';')[0];
        // For ultra-fast audio transcription, we use Google's dedicated real-time audio engines:
        // gemini-2.0-flash is ultra-fast (<1s latency) and natively processes multilingual audio.
        const audioModelsToTry = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
        let lastErr = null;

        for (const targetAudioModel of audioModelsToTry) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetAudioModel}:generateContent?key=${apiKey}`;
            const payload = {
                systemInstruction: {
                    parts: [{ text: "You are an ultra-fast, high-accuracy speech-to-text transcriber. Transcribe the spoken audio faithfully in the exact language spoken (such as Arabic or English). Return ONLY the transcription with NO commentary, quotes, or markdown formatting." }]
                },
                contents: [{
                    role: 'user',
                    parts: [
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: base64Data
                            }
                        },
                        { text: "Transcribe this speech directly into text." }
                    ]
                }],
                generationConfig: {
                    temperature: 0.0,
                    maxOutputTokens: 1024,
                    thinkingConfig: { thinkingBudget: 0 }
                }
            };

            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    const data = await res.json();
                    const transcribed = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                    if (transcribed.trim()) {
                        return transcribed.trim();
                    }
                } else {
                    const errData = await res.json().catch(() => ({}));
                    lastErr = errData.error?.message || `[HTTP ${res.status}]`;
                }
            } catch (err) {
                lastErr = err.message;
            }
        }

        throw new Error(`Audio transcription failed: ${lastErr || 'No speech detected.'}`);
    }
}

class AnthropicProvider extends BaseProvider {
    async sendMessage(messages, systemInstruction, options = {}) {
        let base = this.baseUrl ? this.baseUrl.replace(/\/+$/, '') : 'https://api.anthropic.com';
        base = base.replace(/\/chat\/completions\/?$/, '');
        base = base.replace(/\/v1\/?$/, '');
        const url = `${base}/v1/messages`;

        const payloadMessages = messages.map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content
        }));

        const bodyPayload = {
            model: this.model || 'claude-sonnet-5-5',
            max_tokens: 4096,
            messages: payloadMessages
        };

        if (systemInstruction) {
            bodyPayload.system = systemInstruction;
        }

        const fetchOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(bodyPayload)
        };
        if (options.signal) fetchOptions.signal = options.signal;
        const res = await fetch(url, fetchOptions);

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error?.message || `[Anthropic Error ${res.status}] ${res.statusText}`);
        }

        const data = await res.json();
        return data.content?.[0]?.text || 'No response content.';
    }
}

class OllamaProvider extends BaseProvider {
    async sendMessage(messages, systemInstruction, options = {}) {
        let base = this.baseUrl ? this.baseUrl.replace(/\/+$/, '') : 'http://localhost:11434';
        base = base.replace(/\/chat\/completions\/?$/, '');
        base = base.replace(/\/api\/?$/, '');
        const url = `${base}/api/chat`;

        const payloadMessages = [];
        if (systemInstruction) {
            payloadMessages.push({ role: 'system', content: systemInstruction });
        }
        messages.forEach(m => payloadMessages.push({ role: m.role, content: m.content }));

        const fetchOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.model || 'llama3',
                messages: payloadMessages,
                stream: false
            })
        };
        if (options.signal) fetchOptions.signal = options.signal;
        const res = await fetch(url, fetchOptions);

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `[Ollama Error ${res.status}] ${res.statusText}`);
        }

        const data = await res.json();
        return data.message?.content || 'No response content.';
    }
}

class AIProviderFactory {
    static getProvider(apiConfig) {
        if (!apiConfig) {
            throw new Error('No API configuration available.');
        }

        const model = (apiConfig.model || '').toLowerCase();
        const baseUrl = (apiConfig.baseUrl || '').toLowerCase();
        const provider = (apiConfig.provider || '').toLowerCase();

        // Explicit OpenRouter / OpenAI compatible routing
        if (baseUrl.includes('openrouter') || provider === 'custom') {
            return new OpenAIProvider(apiConfig);
        }

        if (provider === 'gemini' || model.includes('gemini') || baseUrl.includes('googleapis') || baseUrl.includes('generativelanguage')) {
            return new GeminiProvider(apiConfig);
        } else if (provider === 'anthropic' || model.includes('claude') || baseUrl.includes('anthropic')) {
            return new AnthropicProvider(apiConfig);
        } else if (provider === 'ollama' || baseUrl.includes('11434') || model.includes('ollama') || baseUrl.includes('ollama')) {
            return new OllamaProvider(apiConfig);
        } else {
            // OpenAI and OpenAI-compatible providers (OpenRouter, Groq, Together, etc.)
            return new OpenAIProvider(apiConfig);
        }
    }
}

window.AIProviderFactory = AIProviderFactory;
