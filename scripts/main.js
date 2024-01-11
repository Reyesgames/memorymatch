"use strict";
window.DOMHandler = class {
    constructor(a, b) {
        this._iRuntime = a, this._componentId = b, this._hasTickCallback = !1, this._tickCallback = () => this.Tick()
    }
    Attach() {}
    PostToRuntime(a, b, c, d) {
        this._iRuntime.PostToRuntimeComponent(this._componentId, a, b, c, d)
    }
    PostToRuntimeAsync(a, b, c, d) {
        return this._iRuntime.PostToRuntimeComponentAsync(this._componentId, a, b, c, d)
    }
    _PostToRuntimeMaybeSync(a, b, c) {
        this._iRuntime.UsesWorker() ? this.PostToRuntime(a, b, c) : this._iRuntime._GetLocalRuntime()["_OnMessageFromDOM"]({
            "type": "event",
            "component": this._componentId,
            "handler": a,
            "dispatchOpts": c || null,
            "data": b,
            "responseId": null
        })
    }
    AddRuntimeMessageHandler(a, b) {
        this._iRuntime.AddRuntimeComponentMessageHandler(this._componentId, a, b)
    }
    AddRuntimeMessageHandlers(a) {
        for (const [b, c] of a) this.AddRuntimeMessageHandler(b, c)
    }
    GetRuntimeInterface() {
        return this._iRuntime
    }
    GetComponentID() {
        return this._componentId
    }
    _StartTicking() {
        this._hasTickCallback || (this._iRuntime._AddRAFCallback(this._tickCallback), this._hasTickCallback = !0)
    }
    _StopTicking() {
        this._hasTickCallback && (this._iRuntime._RemoveRAFCallback(this._tickCallback), this._hasTickCallback = !1)
    }
    Tick() {}
}, window.RateLimiter = class {
    constructor(a, b) {
        this._callback = a, this._interval = b, this._timerId = -1, this._lastCallTime = -Infinity, this._timerCallFunc = () => this._OnTimer(), this._ignoreReset = !1, this._canRunImmediate = !1
    }
    SetCanRunImmediate(a) {
        this._canRunImmediate = !!a
    }
    Call() {
        if (-1 === this._timerId) {
            const a = Date.now(),
                b = a - this._lastCallTime,
                c = this._interval;
            b >= c && this._canRunImmediate ? (this._lastCallTime = a, this._RunCallback()) : this._timerId = self.setTimeout(this._timerCallFunc, Math.max(c - b, 4))
        }
    }
    _RunCallback() {
        this._ignoreReset = !0, this._callback(), this._ignoreReset = !1
    }
    Reset() {
        this._ignoreReset || (this._CancelTimer(), this._lastCallTime = Date.now())
    }
    _OnTimer() {
        this._timerId = -1, this._lastCallTime = Date.now(), this._RunCallback()
    }
    _CancelTimer() {
        -1 !== this._timerId && (self.clearTimeout(this._timerId), this._timerId = -1)
    }
    Release() {
        this._CancelTimer(), this._callback = null, this._timerCallFunc = null
    }
};

"use strict";
window.DOMElementHandler = class extends DOMHandler {
    constructor(a, b) {
        super(a, b), this._elementMap = new Map, this._autoAttach = !0, this.AddRuntimeMessageHandler("create", (a) => this._OnCreate(a)), this.AddRuntimeMessageHandler("destroy", (a) => this._OnDestroy(a)), this.AddRuntimeMessageHandler("set-visible", (a) => this._OnSetVisible(a)), this.AddRuntimeMessageHandler("update-position", (a) => this._OnUpdatePosition(a)), this.AddRuntimeMessageHandler("update-state", (a) => this._OnUpdateState(a)), this.AddRuntimeMessageHandler("focus", (a) => this._OnSetFocus(a)), this.AddRuntimeMessageHandler("set-css-style", (a) => this._OnSetCssStyle(a))
    }
    SetAutoAttach(a) {
        this._autoAttach = !!a
    }
    AddDOMElementMessageHandler(a, b) {
        this.AddRuntimeMessageHandler(a, (a) => {
            const c = a["elementId"],
                d = this._elementMap.get(c);
            return b(d, a)
        })
    }
    _OnCreate(a) {
        const b = a["elementId"],
            c = this.CreateElement(b, a);
        this._elementMap.set(b, c), a["isVisible"] || (c.style.display = "none"), this._autoAttach && document.body.appendChild(c)
    }
    CreateElement() {
        throw new Error("required override")
    }
    DestroyElement() {}
    _OnDestroy(a) {
        const b = a["elementId"],
            c = this._elementMap.get(b);
        this.DestroyElement(c), this._autoAttach && c.parentElement.removeChild(c), this._elementMap.delete(b)
    }
    PostToRuntimeElement(a, b, c) {
        c || (c = {}), c["elementId"] = b, this.PostToRuntime(a, c)
    }
    _PostToRuntimeElementMaybeSync(a, b, c) {
        c || (c = {}), c["elementId"] = b, this._PostToRuntimeMaybeSync(a, c)
    }
    _OnSetVisible(a) {
        if (this._autoAttach) {
            const b = this._elementMap.get(a["elementId"]);
            b.style.display = a["isVisible"] ? "" : "none"
        }
    }
    _OnUpdatePosition(a) {
        if (this._autoAttach) {
            const b = this._elementMap.get(a["elementId"]);
            b.style.left = a["left"] + "px", b.style.top = a["top"] + "px", b.style.width = a["width"] + "px", b.style.height = a["height"] + "px";
            const c = a["fontSize"];
            null !== c && (b.style.fontSize = c + "em")
        }
    }
    _OnUpdateState(a) {
        const b = this._elementMap.get(a["elementId"]);
        this.UpdateState(b, a)
    }
    UpdateState() {
        throw new Error("required override")
    }
    _OnSetFocus(a) {
        const b = this._elementMap.get(a["elementId"]);
        a["focus"] ? b.focus() : b.blur()
    }
    _OnSetCssStyle(a) {
        const b = this._elementMap.get(a["elementId"]);
        b.style[a["prop"]] = a["val"]
    }
    GetElementById(a) {
        return this._elementMap.get(a)
    }
};

"use strict"; {
    function a(a) {
        if (a.isStringSrc) {
            const b = document.createElement("script");
            b.async = !1, b.textContent = a.str, document.head.appendChild(b)
        } else return new Promise((b, c) => {
            const d = document.createElement("script");
            d.onload = b, d.onerror = c, d.async = !1, d.src = a, document.head.appendChild(d)
        })
    }
    async function b(a) {
        const b = await c(a),
            d = new TextDecoder("utf-8");
        return d.decode(b)
    }

    function c(a) {
        return new Promise((b, c) => {
            const d = new FileReader;
            d.onload = (a) => b(a.target.result), d.onerror = (a) => c(a), d.readAsArrayBuffer(a)
        })
    }

    function d(a) {
        return o.has(a)
    }
    const e = /(iphone|ipod|ipad)/i.test(navigator.userAgent);
    let f = new Audio;
    const g = {
        "audio/webm; codecs=opus": !!f.canPlayType("audio/webm; codecs=opus"),
        "audio/ogg; codecs=opus": !!f.canPlayType("audio/ogg; codecs=opus"),
        "audio/webm; codecs=vorbis": !!f.canPlayType("audio/webm; codecs=vorbis"),
        "audio/ogg; codecs=vorbis": !!f.canPlayType("audio/ogg; codecs=vorbis"),
        "audio/mp4": !!f.canPlayType("audio/mp4"),
        "audio/mpeg": !!f.canPlayType("audio/mpeg")
    };
    f = null;
    const h = [];
    let i = 0;
    window["RealFile"] = window["File"];
    const j = [],
        k = new Map,
        l = new Map;
    let m = 0;
    const n = [];
    self.runOnStartup = function(a) {
        if ("function" != typeof a) throw new Error("runOnStartup called without a function");
        n.push(a)
    }, self.getGlobal = function(a) {
        if (!a) throw new Error("missing global variable");
        return a
    };
    const o = new Set(["cordova", "playable-ad", "instant-games"]);
    window.RuntimeInterface = class f {
        constructor(a) {
            this._useWorker = a.useWorker, this._messageChannelPort = null, this._baseUrl = "", this._scriptFolder = a.scriptFolder, this._workerScriptBlobURLs = {}, this._worker = null, this._localRuntime = null, this._domHandlers = [], this._runtimeDomHandler = null, this._canvas = null, this._jobScheduler = null, this._rafId = -1, this._rafFunc = () => this._OnRAFCallback(), this._rafCallbacks = [], this._exportType = a.exportType, d(this._exportType) && this._useWorker && (console.warn("[C3 runtime] Worker mode is enabled and supported, but is disabled in WebViews due to crbug.com/923007. Reverting to DOM mode."), this._useWorker = !1), this._transferablesBroken = !1, this._localFileBlobs = null, this._localFileStrings = null, ("html5" === this._exportType || "playable-ad" === this._exportType) && "file" === location.protocol.substr(0, 4) && alert("Exported games won't work until you upload them. (When running on the file: protocol, browsers block many features from working for security reasons.)"), this.AddRuntimeComponentMessageHandler("runtime", "cordova-fetch-local-file", (a) => this._OnCordovaFetchLocalFile(a)), this.AddRuntimeComponentMessageHandler("runtime", "create-job-worker", (a) => this._OnCreateJobWorker(a)), "cordova" === this._exportType ? document.addEventListener("deviceready", () => this._Init(a)) : this._Init(a)
        }
        Release() {
            this._CancelAnimationFrame(), this._messageChannelPort && (this._messageChannelPort.onmessage = null, this._messageChannelPort = null), this._worker && (this._worker.terminate(), this._worker = null), this._localRuntime && (this._localRuntime.Release(), this._localRuntime = null), this._canvas && (this._canvas.parentElement.removeChild(this._canvas), this._canvas = null)
        }
        GetCanvas() {
            return this._canvas
        }
        GetBaseURL() {
            return this._baseUrl
        }
        UsesWorker() {
            return this._useWorker
        }
        GetExportType() {
            return this._exportType
        }
        IsiOSCordova() {
            return e && "cordova" === this._exportType
        }
        IsiOSWebView() {
            return e && d(this._exportType) || navigator["standalone"]
        }
        async _Init(a) {
            if ("playable-ad" === this._exportType) {
                this._localFileBlobs = self["c3_base64files"], this._localFileStrings = {}, await this._ConvertDataUrisToBlobs();
                for (let b = 0, c = a.engineScripts.length; b < c; ++b) {
                    const c = a.engineScripts[b].toLowerCase();
                    this._localFileStrings.hasOwnProperty(c) ? a.engineScripts[b] = {
                        isStringSrc: !0,
                        str: this._localFileStrings[c]
                    } : this._localFileBlobs.hasOwnProperty(c) && (a.engineScripts[b] = URL.createObjectURL(this._localFileBlobs[c]))
                }
            }
            if (a.baseUrl) this._baseUrl = a.baseUrl;
            else {
                const a = location.origin;
                this._baseUrl = ("null" === a ? "file:///" : a) + location.pathname;
                const b = this._baseUrl.lastIndexOf("/"); - 1 !== b && (this._baseUrl = this._baseUrl.substr(0, b + 1))
            }
            if (a.workerScripts)
                for (const [b, c] of Object.entries(a.workerScripts)) this._workerScriptBlobURLs[b] = URL.createObjectURL(c);
            const b = new MessageChannel;
            this._messageChannelPort = b.port1, this._messageChannelPort.onmessage = (a) => this["_OnMessageFromRuntime"](a.data), window["c3_addPortMessageHandler"] && window["c3_addPortMessageHandler"]((a) => this._OnMessageFromDebugger(a)), this._jobScheduler = new self.JobSchedulerDOM(this), await this._jobScheduler.Init(), this.MaybeForceBodySize(), "object" == typeof window["StatusBar"] && window["StatusBar"]["hide"](), "object" == typeof window["AndroidFullScreen"] && window["AndroidFullScreen"]["immersiveMode"](), await this._TestTransferablesWork(), this._useWorker ? await this._InitWorker(a, b.port2) : await this._InitDOM(a, b.port2)
        }
        _GetWorkerURL(a) {
            return this._workerScriptBlobURLs.hasOwnProperty(a) ? this._workerScriptBlobURLs[a] : a.endsWith("/workermain.js") && this._workerScriptBlobURLs.hasOwnProperty("workermain.js") ? this._workerScriptBlobURLs["workermain.js"] : "playable-ad" === this._exportType && this._localFileBlobs.hasOwnProperty(a.toLowerCase()) ? URL.createObjectURL(this._localFileBlobs[a.toLowerCase()]) : a
        }
        async CreateWorker(a, b, c) {
            if (a.startsWith("blob:")) return new Worker(a, c);
            if (this.IsiOSCordova()) {
                const b = await this.CordovaFetchLocalFileAsArrayBuffer(this._scriptFolder + a),
                    d = new Blob([b], {
                        type: "application/javascript"
                    });
                return new Worker(URL.createObjectURL(d), c)
            }
            const d = new URL(a, b),
                e = location.origin !== d.origin;
            if (e) {
                const a = await fetch(d);
                if (!a.ok) throw new Error("failed to fetch worker script");
                const b = await a.blob();
                return new Worker(URL.createObjectURL(b), c)
            }
            return new Worker(d, c)
        }
        MaybeForceBodySize() {
            if (this.IsiOSWebView()) {
                const a = document["documentElement"].style,
                    b = document["body"].style,
                    c = window.innerWidth < window.innerHeight,
                    d = c ? window["screen"]["width"] : window["screen"]["height"],
                    e = c ? window["screen"]["height"] : window["screen"]["width"];
                b["height"] = a["height"] = e + "px", b["width"] = a["width"] = d + "px"
            }
        }
        _GetCommonRuntimeOptions(a) {
            return {
                "baseUrl": this._baseUrl,
                "windowInnerWidth": window.innerWidth,
                "windowInnerHeight": window.innerHeight,
                "devicePixelRatio": window.devicePixelRatio,
                "isFullscreen": f.IsDocumentFullscreen(),
                "projectData": a.projectData,
                "previewImageBlobs": window["cr_previewImageBlobs"] || this._localFileBlobs,
                "previewProjectFileBlobs": window["cr_previewProjectFileBlobs"],
                "exportType": a.exportType,
                "isDebug": -1 < self.location.search.indexOf("debug"),
                "ife": !!self.ife,
                "jobScheduler": this._jobScheduler.GetPortData(),
                "supportedAudioFormats": g,
                "opusWasmScriptUrl": window["cr_opusWasmScriptUrl"] || this._scriptFolder + "opus.wasm.js",
                "opusWasmBinaryUrl": window["cr_opusWasmBinaryUrl"] || this._scriptFolder + "opus.wasm.wasm",
                "isiOSCordova": this.IsiOSCordova(),
                "isiOSWebView": this.IsiOSWebView(),
                "isFBInstantAvailable": "undefined" != typeof self["FBInstant"]
            }
        }
        async _InitWorker(a, b) {
            const c = this._GetWorkerURL(a.workerMainUrl);
            this._worker = await this.CreateWorker(c, this._baseUrl, {
                name: "Runtime"
            }), this._canvas = document.createElement("canvas"), this._canvas.style.display = "none";
            const d = this._canvas["transferControlToOffscreen"]();
            document.body.appendChild(this._canvas), window["c3canvas"] = this._canvas, this._worker.postMessage(Object.assign(this._GetCommonRuntimeOptions(a), {
                "type": "init-runtime",
                "isInWorker": !0,
                "messagePort": b,
                "canvas": d,
                "workerDependencyScripts": a.workerDependencyScripts || [],
                "engineScripts": a.engineScripts,
                "projectScripts": window.cr_allProjectScripts,
                "projectScriptsStatus": self["C3_ProjectScriptsStatus"]
            }), [b, d, ...this._jobScheduler.GetPortTransferables()]), this._domHandlers = j.map((a) => new a(this)), this._FindRuntimeDOMHandler(), self["c3_callFunction"] = (a, b) => this._runtimeDomHandler._InvokeFunctionFromJS(a, b), "preview" === this._exportType && (self["goToLastErrorScript"] = () => this.PostToRuntimeComponent("runtime", "go-to-last-error-script"))
        }
        async _InitDOM(b, c) {
            this._canvas = document.createElement("canvas"), this._canvas.style.display = "none", document.body.appendChild(this._canvas), window["c3canvas"] = this._canvas, this._domHandlers = j.map((a) => new a(this)), this._FindRuntimeDOMHandler();
            const d = b.engineScripts.map((a) => "string" == typeof a ? new URL(a, this._baseUrl).toString() : a);
            if (Array.isArray(b.workerDependencyScripts) && d.unshift(...b.workerDependencyScripts), await Promise.all(d.map((b) => a(b))), b.projectScripts && 0 < b.projectScripts.length) {
                const c = self["C3_ProjectScriptsStatus"];
                try {
                    if (await Promise.all(b.projectScripts.map((b) => a(b[1]))), Object.values(c).some((a) => !a)) return void self.setTimeout(() => this._ReportProjectScriptError(c), 100)
                } catch (a) {
                    return console.error("[Preview] Error loading project scripts: ", a), void self.setTimeout(() => this._ReportProjectScriptError(c), 100)
                }
            }
            if ("preview" === this._exportType && "object" != typeof self.C3.ScriptsInEvents) {
                return console.error("[C3 runtime] Failed to load JavaScript code used in events. Check all your JavaScript code has valid syntax."), void alert("Failed to load JavaScript code used in events. Check all your JavaScript code has valid syntax.")
            }
            const e = Object.assign(this._GetCommonRuntimeOptions(b), {
                "isInWorker": !1,
                "messagePort": c,
                "canvas": this._canvas,
                "runOnStartupFunctions": n
            });
            this._localRuntime = self["C3_CreateRuntime"](e), await self["C3_InitRuntime"](this._localRuntime, e)
        }
        _ReportProjectScriptError(a) {
            const b = Object.entries(a).filter((a) => !a[1]).map((a) => a[0]),
                c = `Failed to load project script '${b[0]}'. Check all your JavaScript code has valid syntax.`;
            console.error("[Preview] " + c), alert(c)
        }
        async _OnCreateJobWorker() {
            const a = await this._jobScheduler._CreateJobWorker();
            return {
                "outputPort": a,
                "transferables": [a]
            }
        }
        _GetLocalRuntime() {
            if (this._useWorker) throw new Error("not available in worker mode");
            return this._localRuntime
        }
        PostToRuntimeComponent(a, b, c, d, e) {
            this._messageChannelPort.postMessage({
                "type": "event",
                "component": a,
                "handler": b,
                "dispatchOpts": d || null,
                "data": c,
                "responseId": null
            }, this._transferablesBroken ? void 0 : e)
        }
        PostToRuntimeComponentAsync(a, b, c, d, e) {
            const f = m++,
                g = new Promise((a, b) => {
                    l.set(f, {
                        resolve: a,
                        reject: b
                    })
                });
            return this._messageChannelPort.postMessage({
                "type": "event",
                "component": a,
                "handler": b,
                "dispatchOpts": d || null,
                "data": c,
                "responseId": f
            }, this._transferablesBroken ? void 0 : e), g
        }["_OnMessageFromRuntime"](a) {
            const b = a["type"];
            if ("event" === b) this._OnEventFromRuntime(a);
            else if ("result" === b) this._OnResultFromRuntime(a);
            else if ("runtime-ready" === b) this._OnRuntimeReady();
            else if ("alert" === b) alert(a["message"]);
            else throw new Error(`unknown message '${b}'`)
        }
        _OnEventFromRuntime(a) {
            const b = a["component"],
                c = a["handler"],
                d = a["data"],
                e = a["responseId"],
                f = k.get(b);
            if (!f) return void console.warn(`[DOM] No event handlers for component '${b}'`);
            const g = f.get(c);
            if (!g) return void console.warn(`[DOM] No handler '${c}' for component '${b}'`);
            let h = null;
            try {
                h = g(d)
            } catch (a) {
                return console.error(`Exception in '${b}' handler '${c}':`, a), void(null !== e && this._PostResultToRuntime(e, !1, "" + a))
            }
            null !== e && (h && h.then ? h.then((a) => this._PostResultToRuntime(e, !0, a)).catch((a) => {
                console.error(`Rejection from '${b}' handler '${c}':`, a), this._PostResultToRuntime(e, !1, "" + a)
            }) : this._PostResultToRuntime(e, !0, h))
        }
        _PostResultToRuntime(a, b, c) {
            let d;
            c && c["transferables"] && (d = c["transferables"]), this._messageChannelPort.postMessage({
                "type": "result",
                "responseId": a,
                "isOk": b,
                "result": c
            }, d)
        }
        _OnResultFromRuntime(a) {
            const b = a["responseId"],
                c = a["isOk"],
                d = a["result"],
                e = l.get(b);
            c ? e.resolve(d) : e.reject(d), l.delete(b)
        }
        AddRuntimeComponentMessageHandler(a, b, c) {
            let d = k.get(a);
            if (d || (d = new Map, k.set(a, d)), d.has(b)) throw new Error(`[DOM] Component '${a}' already has handler '${b}'`);
            d.set(b, c)
        }
        static AddDOMHandlerClass(a) {
            if (j.includes(a)) throw new Error("DOM handler already added");
            j.push(a)
        }
        _FindRuntimeDOMHandler() {
            for (const a of this._domHandlers)
                if ("runtime" === a.GetComponentID()) return void(this._runtimeDomHandler = a);
            throw new Error("cannot find runtime DOM handler")
        }
        _OnMessageFromDebugger(a) {
            this.PostToRuntimeComponent("debugger", "message", a)
        }
        _OnRuntimeReady() {
            for (const a of this._domHandlers) a.Attach()
        }
        static IsDocumentFullscreen() {
            return !!(document["fullscreenElement"] || document["webkitFullscreenElement"] || document["mozFullScreenElement"])
        }
        async GetRemotePreviewStatusInfo() {
            return await this.PostToRuntimeComponentAsync("runtime", "get-remote-preview-status-info")
        }
        _AddRAFCallback(a) {
            this._rafCallbacks.push(a), this._RequestAnimationFrame()
        }
        _RemoveRAFCallback(a) {
            const b = this._rafCallbacks.indexOf(a);
            if (-1 === b) throw new Error("invalid callback");
            this._rafCallbacks.splice(b, 1), this._rafCallbacks.length || this._CancelAnimationFrame()
        }
        _RequestAnimationFrame() {
            -1 === this._rafId && this._rafCallbacks.length && (this._rafId = requestAnimationFrame(this._rafFunc))
        }
        _CancelAnimationFrame() {
            -1 !== this._rafId && (cancelAnimationFrame(this._rafId), this._rafId = -1)
        }
        _OnRAFCallback() {
            this._rafId = -1;
            for (const a of this._rafCallbacks) a();
            this._RequestAnimationFrame()
        }
        TryPlayMedia(a) {
            this._runtimeDomHandler.TryPlayMedia(a)
        }
        RemovePendingPlay(a) {
            this._runtimeDomHandler.RemovePendingPlay(a)
        }
        _PlayPendingMedia() {
            this._runtimeDomHandler._PlayPendingMedia()
        }
        SetSilent(a) {
            this._runtimeDomHandler.SetSilent(a)
        }
        IsAudioFormatSupported(a) {
            return !!g[a]
        }
        async _WasmDecodeWebMOpus(a) {
            const b = await this.PostToRuntimeComponentAsync("runtime", "opus-decode", {
                "arrayBuffer": a
            }, null, [a]);
            return new Float32Array(b)
        }
        IsAbsoluteURL(a) {
            return /^(?:[a-z]+:)?\/\//.test(a) || "data:" === a.substr(0, 5) || "blob:" === a.substr(0, 5)
        }
        IsRelativeURL(a) {
            return !this.IsAbsoluteURL(a)
        }
        async _OnCordovaFetchLocalFile(a) {
            const b = a["filename"];
            switch (a["as"]) {
                case "text":
                    return await this.CordovaFetchLocalFileAsText(b);
                case "buffer":
                    return await this.CordovaFetchLocalFileAsArrayBuffer(b);
                default:
                    throw new Error("unsupported type");
            }
        }
        _GetPermissionAPI() {
            const a = window["cordova"] && window["cordova"]["plugins"] && window["cordova"]["plugins"]["permissions"];
            if ("object" != typeof a) throw new Error("Permission API is not loaded");
            return a
        }
        _MapPermissionID(a, b) {
            const c = a[b];
            if ("string" != typeof c) throw new Error("Invalid permission name");
            return c
        }
        _HasPermission(a) {
            const b = this._GetPermissionAPI();
            return new Promise((c, d) => b["checkPermission"](this._MapPermissionID(b, a), (a) => c(!!a["hasPermission"]), d))
        }
        _RequestPermission(a) {
            const b = this._GetPermissionAPI();
            return new Promise((c, d) => b["requestPermission"](this._MapPermissionID(b, a), (a) => c(!!a["hasPermission"]), d))
        }
        async RequestPermissions(a) {
            if ("cordova" !== this.GetExportType()) return !0;
            if (this.IsiOSCordova()) return !0;
            for (const b of a) {
                const a = await this._HasPermission(b);
                if (a) continue;
                const c = await this._RequestPermission(b);
                if (!1 === c) return !1
            }
            return !0
        }
        async RequirePermissions(...a) {
            if (!1 === (await this.RequestPermissions(a))) throw new Error("Permission not granted")
        }
        CordovaFetchLocalFile(a) {
            const b = window["cordova"]["file"]["applicationDirectory"] + "www/" + a.toLowerCase();
            return new Promise((a, c) => {
                window["resolveLocalFileSystemURL"](b, (b) => {
                    b["file"](a, c)
                }, c)
            })
        }
        async CordovaFetchLocalFileAsText(a) {
            const c = await this.CordovaFetchLocalFile(a);
            return await b(c)
        }
        _CordovaMaybeStartNextArrayBufferRead() {
            if (h.length && !(i >= 8)) {
                i++;
                const a = h.shift();
                this._CordovaDoFetchLocalFileAsAsArrayBuffer(a.filename, a.successCallback, a.errorCallback)
            }
        }
        CordovaFetchLocalFileAsArrayBuffer(a) {
            return new Promise((b, c) => {
                h.push({
                    filename: a,
                    successCallback: (a) => {
                        i--, this._CordovaMaybeStartNextArrayBufferRead(), b(a)
                    },
                    errorCallback: (a) => {
                        i--, this._CordovaMaybeStartNextArrayBufferRead(), c(a)
                    }
                }), this._CordovaMaybeStartNextArrayBufferRead()
            })
        }
        async _CordovaDoFetchLocalFileAsAsArrayBuffer(a, b, d) {
            try {
                const d = await this.CordovaFetchLocalFile(a),
                    e = await c(d);
                b(e)
            } catch (a) {
                d(a)
            }
        }
        async _ConvertDataUrisToBlobs() {
            const a = [];
            for (const [b, c] of Object.entries(this._localFileBlobs)) a.push(this._ConvertDataUriToBlobs(b, c));
            await Promise.all(a)
        }
        async _ConvertDataUriToBlobs(a, b) {
            if ("object" == typeof b) this._localFileBlobs[a] = new Blob([b["str"]], {
                "type": b["type"]
            }), this._localFileStrings[a] = b["str"];
            else {
                let c = await this._FetchDataUri(b);
                c || (c = this._DataURIToBinaryBlobSync(b)), this._localFileBlobs[a] = c
            }
        }
        async _FetchDataUri(a) {
            try {
                const b = await fetch(a);
                return await b.blob()
            } catch (a) {
                return console.warn("Failed to fetch a data: URI. Falling back to a slower workaround. This is probably because the Content Security Policy unnecessarily blocked it. Allow data: URIs in your CSP to avoid this.", a), null
            }
        }
        _DataURIToBinaryBlobSync(a) {
            const b = this._ParseDataURI(a);
            return this._BinaryStringToBlob(b.data, b.mime_type)
        }
        _ParseDataURI(a) {
            const b = a.indexOf(",");
            if (0 > b) throw new URIError("expected comma in data: uri");
            const c = a.substring(5, b),
                d = a.substring(b + 1),
                e = c.split(";"),
                f = e[0] || "",
                g = e[1],
                h = e[2];
            let i;
            return i = "base64" === g || "base64" === h ? atob(d) : decodeURIComponent(d), {
                mime_type: f,
                data: i
            }
        }
        _BinaryStringToBlob(a, b) {
            let c, d, e = a.length,
                f = e >> 2,
                g = new Uint8Array(e),
                h = new Uint32Array(g.buffer, 0, f);
            for (c = 0, d = 0; c < f; ++c) h[c] = a.charCodeAt(d++) | a.charCodeAt(d++) << 8 | a.charCodeAt(d++) << 16 | a.charCodeAt(d++) << 24;
            for (let c = 3 & e; c--;) g[d] = a.charCodeAt(d), ++d;
            return new Blob([g], {
                "type": b
            })
        }
        _TestTransferablesWork() {
            let a = null;
            const b = new Promise((b) => a = b),
                c = new ArrayBuffer(1),
                d = new MessageChannel;
            return d.port2.onmessage = (b) => {
                b.data && b.data["arrayBuffer"] || (this._transferablesBroken = !0, console.warn("MessageChannel transfers determined to be broken. Disabling transferables.")), a()
            }, d.port1.postMessage({
                "arrayBuffer": c
            }, [c]), b
        }
    }
}

"use strict"; {
    function a(a) {
        return a["sourceCapabilities"] && a["sourceCapabilities"]["firesTouchEvents"] || a["originalEvent"] && a["originalEvent"]["sourceCapabilities"] && a["originalEvent"]["sourceCapabilities"]["firesTouchEvents"]
    }

    function b(a) {
        return new Promise((b, c) => {
            const d = document.createElement("link");
            d.onload = () => b(d), d.onerror = (a) => c(a), d.rel = "stylesheet", d.href = a, document.head.appendChild(d)
        })
    }

    function c(a) {
        return new Promise((b, c) => {
            const d = new Image;
            d.onload = () => b(d), d.onerror = (a) => c(a), d.src = a
        })
    }
    async function d(a) {
        const b = URL.createObjectURL(a);
        try {
            return await c(b)
        } finally {
            URL.revokeObjectURL(b)
        }
    }

    function e(a) {
        return new Promise((b, c) => {
            let d = new FileReader;
            d.onload = (a) => b(a.target.result), d.onerror = (a) => c(a), d.readAsText(a)
        })
    }
    async function f(a, b, c) {
        if (!/firefox/i.test(navigator.userAgent)) return await d(a);
        let f = await e(a);
        const g = new DOMParser,
            h = g.parseFromString(f, "image/svg+xml"),
            i = h.documentElement;
        if (i.hasAttribute("width") && i.hasAttribute("height")) {
            const b = i.getAttribute("width"),
                c = i.getAttribute("height");
            if (!b.includes("%") && !c.includes("%")) return await d(a)
        }
        i.setAttribute("width", b + "px"), i.setAttribute("height", c + "px");
        const j = new XMLSerializer;
        return f = j.serializeToString(h), a = new Blob([f], {
            type: "image/svg+xml"
        }), await d(a)
    }

    function g(a) {
        do {
            if (a.parentNode && a.hasAttribute("contenteditable")) return !0;
            a = a.parentNode
        } while (a);
        return !1
    }

    function h(a) {
        const b = a.target.tagName.toLowerCase();
        p.has(b) && a.preventDefault()
    }

    function i(a) {
        (a.metaKey || a.ctrlKey) && a.preventDefault()
    }

    function j() {
        try {
            return window.parent && window.parent.document.hasFocus()
        } catch (a) {
            return !1
        }
    }

    function k() {
        const a = document.activeElement;
        if (!a) return !1;
        const b = a.tagName.toLowerCase(),
            c = new Set(["email", "number", "password", "search", "tel", "text", "url"]);
        return !("textarea" !== b) || ("input" === b ? c.has(a.type.toLowerCase() || "text") : g(a))
    }
    const l = new Map([
            ["OSLeft", "MetaLeft"],
            ["OSRight", "MetaRight"]
        ]),
        m = {
            "dispatchRuntimeEvent": !0,
            "dispatchUserScriptEvent": !0
        },
        n = {
            "dispatchUserScriptEvent": !0
        },
        o = {
            "dispatchRuntimeEvent": !0
        };
    const p = new Set(["canvas", "body", "html"]);
    self["C3_GetSvgImageSize"] = async function(a) {
        const b = await d(a);
        if (0 < b.width && 0 < b.height) return [b.width, b.height];
        else {
            b.style.position = "absolute", b.style.left = "0px", b.style.top = "0px", b.style.visibility = "hidden", document.body.appendChild(b);
            const a = b.getBoundingClientRect();
            return document.body.removeChild(b), [a.width, a.height]
        }
    }, self["C3_RasterSvgImageBlob"] = async function(a, b, c, d, e) {
        const g = await f(a, b, c),
            h = document.createElement("canvas");
        h.width = d, h.height = e;
        const i = h.getContext("2d");
        return i.drawImage(g, 0, 0, b, c), h
    };
    let q = !1;
    document.addEventListener("pause", () => q = !0), document.addEventListener("resume", () => q = !1);
    const r = class extends DOMHandler {
        constructor(a) {
            super(a, "runtime"), this._isFirstSizeUpdate = !0, this._simulatedResizeTimerId = -1, this._targetOrientation = "any", this._attachedDeviceOrientationEvent = !1, this._attachedDeviceMotionEvent = !1, this._debugHighlightElem = null, this._pointerRawUpdateRateLimiter = null, this._lastPointerRawUpdateEvent = null, a.AddRuntimeComponentMessageHandler("canvas", "update-size", (a) => this._OnUpdateCanvasSize(a)), a.AddRuntimeComponentMessageHandler("runtime", "invoke-download", (a) => this._OnInvokeDownload(a)), a.AddRuntimeComponentMessageHandler("runtime", "raster-svg-image", (a) => this._OnRasterSvgImage(a)), a.AddRuntimeComponentMessageHandler("runtime", "get-svg-image-size", (a) => this._OnGetSvgImageSize(a)), a.AddRuntimeComponentMessageHandler("runtime", "set-target-orientation", (a) => this._OnSetTargetOrientation(a)), a.AddRuntimeComponentMessageHandler("runtime", "register-sw", () => this._OnRegisterSW()), a.AddRuntimeComponentMessageHandler("runtime", "post-to-debugger", (a) => this._OnPostToDebugger(a)), a.AddRuntimeComponentMessageHandler("runtime", "go-to-script", (a) => this._OnPostToDebugger(a)), a.AddRuntimeComponentMessageHandler("runtime", "before-start-ticking", () => this._OnBeforeStartTicking()), a.AddRuntimeComponentMessageHandler("runtime", "debug-highlight", (a) => this._OnDebugHighlight(a)), a.AddRuntimeComponentMessageHandler("runtime", "enable-device-orientation", () => this._AttachDeviceOrientationEvent()), a.AddRuntimeComponentMessageHandler("runtime", "enable-device-motion", () => this._AttachDeviceMotionEvent()), a.AddRuntimeComponentMessageHandler("runtime", "add-stylesheet", (a) => this._OnAddStylesheet(a)), a.AddRuntimeComponentMessageHandler("runtime", "alert", (a) => this._OnAlert(a));
            const b = new Set(["input", "textarea", "datalist"]);
            window.addEventListener("contextmenu", (a) => {
                const c = a.target,
                    d = c.tagName.toLowerCase();
                b.has(d) || g(c) || a.preventDefault()
            });
            const c = a.GetCanvas();
            window.addEventListener("selectstart", h), window.addEventListener("gesturehold", h), c.addEventListener("selectstart", h), c.addEventListener("gesturehold", h), window.addEventListener("touchstart", h, {
                "passive": !1
            }), "undefined" == typeof PointerEvent ? c.addEventListener("touchstart", h) : (window.addEventListener("pointerdown", h, {
                "passive": !1
            }), c.addEventListener("pointerdown", h)), this._mousePointerLastButtons = 0, window.addEventListener("mousedown", (a) => {
                1 === a.button && a.preventDefault()
            }), window.addEventListener("mousewheel", i, {
                "passive": !1
            }), window.addEventListener("wheel", i, {
                "passive": !1
            }), window.addEventListener("resize", () => this._OnWindowResize()), a.IsiOSWebView() && window.addEventListener("focusout", () => {
                k() || (document.scrollingElement.scrollTop = 0)
            }), this._mediaPendingPlay = new Set, this._mediaRemovedPendingPlay = new WeakSet, this._isSilent = !1
        }
        _OnBeforeStartTicking() {
            return "cordova" === this._iRuntime.GetExportType() ? (document.addEventListener("pause", () => this._OnVisibilityChange(!0)), document.addEventListener("resume", () => this._OnVisibilityChange(!1))) : document.addEventListener("visibilitychange", () => this._OnVisibilityChange(document.hidden)), {
                "isSuspended": !!(document.hidden || q)
            }
        }
        Attach() {
            window.addEventListener("focus", () => this._PostRuntimeEvent("window-focus")), window.addEventListener("blur", () => {
                this._PostRuntimeEvent("window-blur", {
                    "parentHasFocus": j()
                }), this._mousePointerLastButtons = 0
            }), window.addEventListener("fullscreenchange", () => this._OnFullscreenChange()), window.addEventListener("webkitfullscreenchange", () => this._OnFullscreenChange()), window.addEventListener("mozfullscreenchange", () => this._OnFullscreenChange()), window.addEventListener("fullscreenerror", (a) => this._OnFullscreenError(a)), window.addEventListener("webkitfullscreenerror", (a) => this._OnFullscreenError(a)), window.addEventListener("mozfullscreenerror", (a) => this._OnFullscreenError(a)), window.addEventListener("keydown", (a) => this._OnKeyEvent("keydown", a)), window.addEventListener("keyup", (a) => this._OnKeyEvent("keyup", a)), window.addEventListener("dblclick", (a) => this._OnMouseEvent("dblclick", a, m)), window.addEventListener("wheel", (a) => this._OnMouseWheelEvent("wheel", a)), "undefined" == typeof PointerEvent ? (window.addEventListener("mousedown", (a) => {
                this._HandlePointerDownFocus(a), this._OnMouseEventAsPointer("pointerdown", a)
            }), window.addEventListener("mousemove", (a) => this._OnMouseEventAsPointer("pointermove", a)), window.addEventListener("mouseup", (a) => this._OnMouseEventAsPointer("pointerup", a)), window.addEventListener("touchstart", (a) => {
                this._HandlePointerDownFocus(a), this._OnTouchEvent("pointerdown", a)
            }), window.addEventListener("touchmove", (a) => this._OnTouchEvent("pointermove", a)), window.addEventListener("touchend", (a) => this._OnTouchEvent("pointerup", a)), window.addEventListener("touchcancel", (a) => this._OnTouchEvent("pointercancel", a))) : (window.addEventListener("pointerdown", (a) => {
                this._HandlePointerDownFocus(a), this._OnPointerEvent("pointerdown", a)
            }), this._iRuntime.UsesWorker() && "undefined" != typeof window["onpointerrawupdate"] && self === self.top ? (this._pointerRawUpdateRateLimiter = new RateLimiter(() => this._DoSendPointerRawUpdate(), 5), this._pointerRawUpdateRateLimiter.SetCanRunImmediate(!0), window.addEventListener("pointerrawupdate", (a) => this._OnPointerRawUpdate(a))) : window.addEventListener("pointermove", (a) => this._OnPointerEvent("pointermove", a)), window.addEventListener("pointerup", (a) => this._OnPointerEvent("pointerup", a)), window.addEventListener("pointercancel", (a) => this._OnPointerEvent("pointercancel", a)));
            const a = () => this._PlayPendingMedia();
            window.addEventListener("pointerup", a, !0), window.addEventListener("touchend", a, !0), window.addEventListener("click", a, !0), window.addEventListener("keydown", a, !0), window.addEventListener("gamepadconnected", a, !0)
        }
        _PostRuntimeEvent(a, b) {
            this.PostToRuntime(a, b || null, o)
        }
        _GetWindowInnerWidth() {
            return Math.max(window.innerWidth, 1)
        }
        _GetWindowInnerHeight() {
            return Math.max(window.innerHeight, 1)
        }
        _OnWindowResize() {
            const a = this._GetWindowInnerWidth(),
                b = this._GetWindowInnerHeight();
            this._PostRuntimeEvent("window-resize", {
                "innerWidth": a,
                "innerHeight": b,
                "devicePixelRatio": window.devicePixelRatio
            }), this._iRuntime.IsiOSWebView() && (-1 !== this._simulatedResizeTimerId && clearTimeout(this._simulatedResizeTimerId), this._OnSimulatedResize(a, b, 0))
        }
        _ScheduleSimulatedResize(a, b, c) {
            -1 !== this._simulatedResizeTimerId && clearTimeout(this._simulatedResizeTimerId), this._simulatedResizeTimerId = setTimeout(() => this._OnSimulatedResize(a, b, c), 48)
        }
        _OnSimulatedResize(a, b, c) {
            const d = this._GetWindowInnerWidth(),
                e = this._GetWindowInnerHeight();
            this._simulatedResizeTimerId = -1, d != a || e != b ? this._PostRuntimeEvent("window-resize", {
                "innerWidth": d,
                "innerHeight": e,
                "devicePixelRatio": window.devicePixelRatio
            }) : 10 > c && this._ScheduleSimulatedResize(d, e, c + 1)
        }
        _OnSetTargetOrientation(a) {
            this._targetOrientation = a["targetOrientation"]
        }
        _TrySetTargetOrientation() {
            const a = this._targetOrientation;
            if (screen["orientation"] && screen["orientation"]["lock"]) screen["orientation"]["lock"](a).catch((a) => console.warn("[Construct 3] Failed to lock orientation: ", a));
            else try {
                let b = !1;
                screen["lockOrientation"] ? b = screen["lockOrientation"](a) : screen["webkitLockOrientation"] ? b = screen["webkitLockOrientation"](a) : screen["mozLockOrientation"] ? b = screen["mozLockOrientation"](a) : screen["msLockOrientation"] && (b = screen["msLockOrientation"](a)), b || console.warn("[Construct 3] Failed to lock orientation")
            } catch (a) {
                console.warn("[Construct 3] Failed to lock orientation: ", a)
            }
        }
        _OnFullscreenChange() {
            const a = RuntimeInterface.IsDocumentFullscreen();
            a && "any" !== this._targetOrientation && this._TrySetTargetOrientation(), this.PostToRuntime("fullscreenchange", {
                "isFullscreen": a,
                "innerWidth": this._GetWindowInnerWidth(),
                "innerHeight": this._GetWindowInnerHeight()
            })
        }
        _OnFullscreenError(a) {
            console.warn("[Construct 3] Fullscreen request failed: ", a), this.PostToRuntime("fullscreenerror", {
                "isFullscreen": RuntimeInterface.IsDocumentFullscreen(),
                "innerWidth": this._GetWindowInnerWidth(),
                "innerHeight": this._GetWindowInnerHeight()
            })
        }
        _OnVisibilityChange(a) {
            a ? this._iRuntime._CancelAnimationFrame() : this._iRuntime._RequestAnimationFrame(), this.PostToRuntime("visibilitychange", {
                "hidden": a
            })
        }
        _OnKeyEvent(a, b) {
            "Backspace" === b.key && h(b);
            const c = l.get(b.code) || b.code;
            this._PostToRuntimeMaybeSync(a, {
                "code": c,
                "key": b.key,
                "which": b.which,
                "repeat": b.repeat,
                "altKey": b.altKey,
                "ctrlKey": b.ctrlKey,
                "metaKey": b.metaKey,
                "shiftKey": b.shiftKey,
                "timeStamp": b.timeStamp
            }, m)
        }
        _OnMouseWheelEvent(a, b) {
            this.PostToRuntime(a, {
                "clientX": b.clientX,
                "clientY": b.clientY,
                "pageX": b.pageX,
                "pageY": b.pageY,
                "deltaX": b.deltaX,
                "deltaY": b.deltaY,
                "deltaZ": b.deltaZ,
                "deltaMode": b.deltaMode,
                "timeStamp": b.timeStamp
            }, m)
        }
        _OnMouseEvent(b, c, d) {
            a(c) || this._PostToRuntimeMaybeSync(b, {
                "button": c.button,
                "buttons": c.buttons,
                "clientX": c.clientX,
                "clientY": c.clientY,
                "pageX": c.pageX,
                "pageY": c.pageY,
                "timeStamp": c.timeStamp
            }, d)
        }
        _OnMouseEventAsPointer(b, c) {
            if (a(c)) return;
            const d = this._mousePointerLastButtons;
            "pointerdown" === b && 0 !== d ? b = "pointermove" : "pointerup" == b && 0 !== c.buttons && (b = "pointermove"), this._PostToRuntimeMaybeSync(b, {
                "pointerId": 1,
                "pointerType": "mouse",
                "button": c.button,
                "buttons": c.buttons,
                "lastButtons": d,
                "clientX": c.clientX,
                "clientY": c.clientY,
                "pageX": c.pageX,
                "pageY": c.pageY,
                "width": 0,
                "height": 0,
                "pressure": 0,
                "tangentialPressure": 0,
                "tiltX": 0,
                "tiltY": 0,
                "twist": 0,
                "timeStamp": c.timeStamp
            }, m), this._mousePointerLastButtons = c.buttons, this._OnMouseEvent(c.type, c, n)
        }
        _OnPointerEvent(a, b) {
            this._pointerRawUpdateRateLimiter && "pointermove" !== a && this._pointerRawUpdateRateLimiter.Reset();
            let c = 0;
            if ("mouse" === b.pointerType && (c = this._mousePointerLastButtons), this._PostToRuntimeMaybeSync(a, {
                    "pointerId": b.pointerId,
                    "pointerType": b.pointerType,
                    "button": b.button,
                    "buttons": b.buttons,
                    "lastButtons": c,
                    "clientX": b.clientX,
                    "clientY": b.clientY,
                    "pageX": b.pageX,
                    "pageY": b.pageY,
                    "width": b.width || 0,
                    "height": b.height || 0,
                    "pressure": b.pressure || 0,
                    "tangentialPressure": b["tangentialPressure"] || 0,
                    "tiltX": b.tiltX || 0,
                    "tiltY": b.tiltY || 0,
                    "twist": b["twist"] || 0,
                    "timeStamp": b.timeStamp
                }, m), "mouse" === b.pointerType) {
                let c = "mousemove";
                "pointerdown" === a ? c = "mousedown" : "pointerup" == a && (c = "pointerup"), this._OnMouseEvent(c, b, n), this._mousePointerLastButtons = b.buttons
            }
        }
        _OnPointerRawUpdate(a) {
            this._lastPointerRawUpdateEvent = a, this._pointerRawUpdateRateLimiter.Call()
        }
        _DoSendPointerRawUpdate() {
            this._OnPointerEvent("pointermove", this._lastPointerRawUpdateEvent), this._lastPointerRawUpdateEvent = null
        }
        _OnTouchEvent(a, b) {
            for (let c = 0, d = b.changedTouches.length; c < d; ++c) {
                const d = b.changedTouches[c];
                this._PostToRuntimeMaybeSync(a, {
                    "pointerId": d.identifier,
                    "pointerType": "touch",
                    "button": 0,
                    "buttons": 0,
                    "lastButtons": 0,
                    "clientX": d.clientX,
                    "clientY": d.clientY,
                    "pageX": d.pageX,
                    "pageY": d.pageY,
                    "width": 2 * (d["radiusX"] || d["webkitRadiusX"] || 0),
                    "height": 2 * (d["radiusY"] || d["webkitRadiusY"] || 0),
                    "pressure": d["force"] || d["webkitForce"] || 0,
                    "tangentialPressure": 0,
                    "tiltX": 0,
                    "tiltY": 0,
                    "twist": d["rotationAngle"] || 0,
                    "timeStamp": b.timeStamp
                }, m)
            }
        }
        _HandlePointerDownFocus(a) {
            window !== window.top && window.focus(), this._IsElementCanvasOrDocument(a.target) && document.activeElement && !this._IsElementCanvasOrDocument(document.activeElement) && document.activeElement.blur()
        }
        _IsElementCanvasOrDocument(a) {
            return !a || a === document || a === window || a === document.body || "canvas" === a.tagName.toLowerCase()
        }
        _AttachDeviceOrientationEvent() {
            this._attachedDeviceOrientationEvent || (this._attachedDeviceOrientationEvent = !0, window.addEventListener("deviceorientation", (a) => this._OnDeviceOrientation(a)))
        }
        _AttachDeviceMotionEvent() {
            this._attachedDeviceMotionEvent || (this._attachedDeviceMotionEvent = !0, window.addEventListener("devicemotion", (a) => this._OnDeviceMotion(a)))
        }
        _OnDeviceOrientation(a) {
            this.PostToRuntime("deviceorientation", {
                "alpha": a["alpha"] || 0,
                "beta": a["beta"] || 0,
                "gamma": a["gamma"] || 0,
                "timeStamp": a.timeStamp
            }, m)
        }
        _OnDeviceMotion(a) {
            let b = null;
            const c = a["acceleration"];
            c && (b = {
                "x": c["x"] || 0,
                "y": c["y"] || 0,
                "z": c["z"] || 0
            });
            let d = null;
            const e = a["accelerationIncludingGravity"];
            e && (d = {
                "x": e["x"] || 0,
                "y": e["y"] || 0,
                "z": e["z"] || 0
            });
            let f = null;
            const g = a["rotationRate"];
            g && (f = {
                "alpha": g["alpha"] || 0,
                "beta": g["beta"] || 0,
                "gamma": g["gamma"] || 0
            }), this.PostToRuntime("devicemotion", {
                "acceleration": b,
                "accelerationIncludingGravity": d,
                "rotationRate": f,
                "interval": a["interval"],
                "timeStamp": a.timeStamp
            }, m)
        }
        _OnUpdateCanvasSize(a) {
            const b = this.GetRuntimeInterface(),
                c = b.GetCanvas();
            c.style.width = a["styleWidth"] + "px", c.style.height = a["styleHeight"] + "px", c.style.marginLeft = a["marginLeft"] + "px", c.style.marginTop = a["marginTop"] + "px", b.MaybeForceBodySize(), this._isFirstSizeUpdate && (c.style.display = "", this._isFirstSizeUpdate = !1)
        }
        _OnInvokeDownload(b) {
            const c = b["url"],
                d = b["filename"],
                e = document.createElement("a"),
                a = document.body;
            e.textContent = d, e.href = c, e.download = d, a.appendChild(e), e.click(), a.removeChild(e)
        }
        async _OnRasterSvgImage(a) {
            const b = a["blob"],
                c = a["imageWidth"],
                d = a["imageHeight"],
                e = a["surfaceWidth"],
                f = a["surfaceHeight"],
                g = a["imageBitmapOpts"],
                h = await self["C3_RasterSvgImageBlob"](b, c, d, e, f);
            let i;
            return i = g ? await createImageBitmap(h, g) : await createImageBitmap(h), {
                "imageBitmap": i,
                "transferables": [i]
            }
        }
        async _OnGetSvgImageSize(a) {
            return await self["C3_GetSvgImageSize"](a["blob"])
        }
        async _OnAddStylesheet(a) {
            await b(a["url"])
        }
        _PlayPendingMedia() {
            const a = [...this._mediaPendingPlay];
            if (this._mediaPendingPlay.clear(), !this._isSilent)
                for (const b of a) {
                    const a = b.play();
                    a && a.catch(() => {
                        this._mediaRemovedPendingPlay.has(b) || this._mediaPendingPlay.add(b)
                    })
                }
        }
        TryPlayMedia(a) {
            if ("function" != typeof a.play) throw new Error("missing play function");
            this._mediaRemovedPendingPlay.delete(a);
            let b;
            try {
                b = a.play()
            } catch (b) {
                return void this._mediaPendingPlay.add(a)
            }
            b && b.catch(() => {
                this._mediaRemovedPendingPlay.has(a) || this._mediaPendingPlay.add(a)
            })
        }
        RemovePendingPlay(a) {
            this._mediaPendingPlay.delete(a), this._mediaRemovedPendingPlay.add(a)
        }
        SetSilent(a) {
            this._isSilent = !!a
        }
        _OnDebugHighlight(a) {
            const b = a["show"];
            if (!b) return void(this._debugHighlightElem && (this._debugHighlightElem.style.display = "none"));
            this._debugHighlightElem || (this._debugHighlightElem = document.createElement("div"), this._debugHighlightElem.id = "inspectOutline", document.body.appendChild(this._debugHighlightElem));
            const c = this._debugHighlightElem;
            c.style.display = "", c.style.left = a["left"] - 1 + "px", c.style.top = a["top"] - 1 + "px", c.style.width = a["width"] + 2 + "px", c.style.height = a["height"] + 2 + "px", c.textContent = a["name"]
        }
        _OnRegisterSW() {
            window["C3_RegisterSW"] && window["C3_RegisterSW"]()
        }
        _OnPostToDebugger(a) {
            window["c3_postToMessagePort"] && (a["from"] = "runtime", window["c3_postToMessagePort"](a))
        }
        _InvokeFunctionFromJS(a, b) {
            return this.PostToRuntimeAsync("js-invoke-function", {
                "name": a,
                "params": b
            })
        }
        _OnAlert(a) {
            alert(a["message"])
        }
    };
    RuntimeInterface.AddDOMHandlerClass(r)
}

"use strict"; {
    const a = document.currentScript.src;
    self.JobSchedulerDOM = class {
        constructor(b) {
            this._runtimeInterface = b, this._baseUrl = a ? a.substr(0, a.lastIndexOf("/") + 1) : b.GetBaseURL(), this._maxNumWorkers = Math.min(navigator.hardwareConcurrency || 2, 16), this._dispatchWorker = null, this._jobWorkers = [], this._inputPort = null, this._outputPort = null
        }
        async Init() {
            if (this._hasInitialised) throw new Error("already initialised");
            this._hasInitialised = !0;
            const a = this._runtimeInterface._GetWorkerURL("dispatchworker.js");
            this._dispatchWorker = await this._runtimeInterface.CreateWorker(a, this._baseUrl, {
                name: "DispatchWorker"
            });
            const b = new MessageChannel;
            this._inputPort = b.port1, this._dispatchWorker.postMessage({
                "type": "_init",
                "in-port": b.port2
            }, [b.port2]), this._outputPort = await this._CreateJobWorker()
        }
        async _CreateJobWorker() {
            const a = this._jobWorkers.length,
                b = this._runtimeInterface._GetWorkerURL("jobworker.js"),
                c = await this._runtimeInterface.CreateWorker(b, this._baseUrl, {
                    name: "JobWorker" + a
                }),
                d = new MessageChannel,
                e = new MessageChannel;
            return this._dispatchWorker.postMessage({
                "type": "_addJobWorker",
                "port": d.port1
            }, [d.port1]), c.postMessage({
                "type": "init",
                "number": a,
                "dispatch-port": d.port2,
                "output-port": e.port2
            }, [d.port2, e.port2]), this._jobWorkers.push(c), e.port1
        }
        GetPortData() {
            return {
                "inputPort": this._inputPort,
                "outputPort": this._outputPort,
                "maxNumWorkers": this._maxNumWorkers
            }
        }
        GetPortTransferables() {
            return [this._inputPort, this._outputPort]
        }
    }
}

"use strict";
if (window["C3_IsSupported"]) {
    const a = true,
        b = "undefined" != typeof OffscreenCanvas;
    window["c3_runtimeInterface"] = new RuntimeInterface({
        useWorker: a && b,
        workerMainUrl: "workermain.js",
        engineScripts: ["scripts/c3runtime.js"],
        scriptFolder: "scripts/",
        workerDependencyScripts: [],
        exportType: "html5"
    })
}
"use strict"; {
    const a = class extends DOMHandler {
        constructor(a) {
            super(a, "touch"), this.AddRuntimeMessageHandler("request-permission", (a) => this._OnRequestPermission(a))
        }
        async _OnRequestPermission(a) {
            const b = a["type"];
            let c = !0;
            0 === b ? c = await this._RequestOrientationPermission() : 1 === b && (c = await this._RequestMotionPermission()), this.PostToRuntime("permission-result", {
                "type": b,
                "result": c
            })
        }
        async _RequestOrientationPermission() {
            if (!self["DeviceOrientationEvent"] || !self["DeviceOrientationEvent"]["requestPermission"]) return !0;
            try {
                const a = await self["DeviceOrientationEvent"]["requestPermission"]();
                return "granted" === a
            } catch (a) {
                return console.warn("[Touch] Failed to request orientation permission: ", a), !1
            }
        }
        async _RequestMotionPermission() {
            if (!self["DeviceMotionEvent"] || !self["DeviceMotionEvent"]["requestPermission"]) return !0;
            try {
                const a = await self["DeviceMotionEvent"]["requestPermission"]();
                return "granted" === a
            } catch (a) {
                return console.warn("[Touch] Failed to request motion permission: ", a), !1
            }
        }
    };
    RuntimeInterface.AddDOMHandlerClass(a)
}
"use strict"; {
    function a(c, a) {
        return !(c.length !== a.length) && (!(c !== a) || c.toLowerCase() === a.toLowerCase())
    }
    const b = class extends DOMHandler {
        constructor(a) {
            super(a, "audio"), this._audioContext = null, this._destinationNode = null, this._hasUnblocked = !1, this._hasAttachedUnblockEvents = !1, this._unblockFunc = () => this._UnblockAudioContext(), this._audioBuffers = [], this._audioInstances = [], this._lastAudioInstance = null, this._lastPlayedTag = "", this._lastTickCount = -1, this._pendingTags = new Map, this._masterVolume = 1, this._isSilent = !1, this._timeScaleMode = 0, this._timeScale = 1, this._gameTime = 0, this._panningModel = "HRTF", this._distanceModel = "inverse", this._refDistance = 600, this._maxDistance = 1e4, this._rolloffFactor = 1, this._playMusicAsSound = !1, this._hasAnySoftwareDecodedMusic = !1, this._supportsWebMOpus = this._iRuntime.IsAudioFormatSupported("audio/webm; codecs=opus"), this._effects = new Map, this._analysers = new Set, this._isPendingPostFxState = !1, this._microphoneTag = "", this._microphoneSource = null, self["C3Audio_OnMicrophoneStream"] = (a, b) => this._OnMicrophoneStream(a, b), this._destMediaStreamNode = null, self["C3Audio_GetOutputStream"] = () => this._OnGetOutputStream(), self["C3Audio_DOMInterface"] = this, this.AddRuntimeMessageHandlers([
                ["create-audio-context", (a) => this._CreateAudioContext(a)],
                ["play", (a) => this._Play(a)],
                ["stop", (a) => this._Stop(a)],
                ["stop-all", () => this._StopAll()],
                ["set-paused", (a) => this._SetPaused(a)],
                ["set-volume", (a) => this._SetVolume(a)],
                ["fade-volume", (a) => this._FadeVolume(a)],
                ["set-master-volume", (a) => this._SetMasterVolume(a)],
                ["set-muted", (a) => this._SetMuted(a)],
                ["set-silent", (a) => this._SetSilent(a)],
                ["set-looping", (a) => this._SetLooping(a)],
                ["set-playback-rate", (a) => this._SetPlaybackRate(a)],
                ["seek", (a) => this._Seek(a)],
                ["preload", (a) => this._Preload(a)],
                ["unload", (a) => this._Unload(a)],
                ["unload-all", () => this._UnloadAll()],
                ["set-suspended", (a) => this._SetSuspended(a)],
                ["add-effect", (a) => this._AddEffect(a)],
                ["set-effect-param", (a) => this._SetEffectParam(a)],
                ["remove-effects", (a) => this._RemoveEffects(a)],
                ["tick", (a) => this._OnTick(a)],
                ["load-state", (a) => this._OnLoadState(a)]
            ])
        }
        async _CreateAudioContext(a) {
            a["isiOSCordova"] && (this._playMusicAsSound = !0), this._timeScaleMode = a["timeScaleMode"], this._panningModel = ["equalpower", "HRTF", "soundfield"][a["panningModel"]], this._distanceModel = ["linear", "inverse", "exponential"][a["distanceModel"]], this._refDistance = a["refDistance"], this._maxDistance = a["maxDistance"], this._rolloffFactor = a["rolloffFactor"];
            const b = {
                "latencyHint": a["latencyHint"]
            };
            if ("undefined" != typeof AudioContext) this._audioContext = new AudioContext(b);
            else if ("undefined" != typeof webkitAudioContext) this._audioContext = new webkitAudioContext(b);
            else throw new Error("Web Audio API not supported");
            this._AttachUnblockEvents(), this._audioContext.onstatechange = () => {
                "running" !== this._audioContext.state && this._AttachUnblockEvents()
            }, this._destinationNode = this._audioContext["createGain"](), this._destinationNode["connect"](this._audioContext["destination"]);
            const c = a["listenerPos"];
            this._audioContext["listener"]["setPosition"](c[0], c[1], c[2]), this._audioContext["listener"]["setOrientation"](0, 0, 1, 0, -1, 0), self["C3_GetAudioContextCurrentTime"] = () => this.GetAudioCurrentTime();
            try {
                await Promise.all(a["preloadList"].map((a) => this._GetAudioBuffer(a["originalUrl"], a["url"], a["type"], !1)))
            } catch (a) {
                console.error("[Construct 3] Preloading sounds failed: ", a)
            }
            return {
                "sampleRate": this._audioContext["sampleRate"]
            }
        }
        _AttachUnblockEvents() {
            this._hasAttachedUnblockEvents || (this._hasUnblocked = !1, window.addEventListener("pointerup", this._unblockFunc, !0), window.addEventListener("touchend", this._unblockFunc, !0), window.addEventListener("click", this._unblockFunc, !0), window.addEventListener("keydown", this._unblockFunc, !0), this._hasAttachedUnblockEvents = !0)
        }
        _DetachUnblockEvents() {
            this._hasAttachedUnblockEvents && (this._hasUnblocked = !0, window.removeEventListener("pointerup", this._unblockFunc, !0), window.removeEventListener("touchend", this._unblockFunc, !0), window.removeEventListener("click", this._unblockFunc, !0), window.removeEventListener("keydown", this._unblockFunc, !0), this._hasAttachedUnblockEvents = !1)
        }
        _UnblockAudioContext() {
            if (!this._hasUnblocked) {
                const a = this._audioContext;
                "suspended" === a["state"] && a["resume"] && a["resume"]();
                const b = a["createBuffer"](1, 220, 22050),
                    c = a["createBufferSource"]();
                c["buffer"] = b, c["connect"](a["destination"]), c["start"](0), "running" === a["state"] && this._DetachUnblockEvents()
            }
        }
        GetAudioContext() {
            return this._audioContext
        }
        GetAudioCurrentTime() {
            return this._audioContext["currentTime"]
        }
        GetDestinationNode() {
            return this._destinationNode
        }
        GetDestinationForTag(a) {
            const b = this._effects.get(a.toLowerCase());
            return b ? b[0].GetInputNode() : this.GetDestinationNode()
        }
        AddEffectForTag(a, b) {
            a = a.toLowerCase();
            let c = this._effects.get(a);
            c || (c = [], this._effects.set(a, c)), b._SetIndex(c.length), b._SetTag(a), c.push(b), this._ReconnectEffects(a)
        }
        _ReconnectEffects(a) {
            let b = this.GetDestinationNode();
            const c = this._effects.get(a);
            if (c && c.length) {
                b = c[0].GetInputNode();
                for (let a = 0, b = c.length; a < b; ++a) {
                    const d = c[a];
                    a + 1 === b ? d.ConnectTo(this.GetDestinationNode()) : d.ConnectTo(c[a + 1].GetInputNode())
                }
            }
            for (const c of this.audioInstancesByTag(a)) c.Reconnect(b);
            this._microphoneSource && this._microphoneTag === a && (this._microphoneSource["disconnect"](), this._microphoneSource["connect"](b))
        }
        GetMasterVolume() {
            return this._masterVolume
        }
        IsSilent() {
            return this._isSilent
        }
        GetTimeScaleMode() {
            return this._timeScaleMode
        }
        GetTimeScale() {
            return this._timeScale
        }
        GetGameTime() {
            return this._gameTime
        }
        IsPlayMusicAsSound() {
            return this._playMusicAsSound
        }
        SupportsWebMOpus() {
            return this._supportsWebMOpus
        }
        _SetHasAnySoftwareDecodedMusic() {
            this._hasAnySoftwareDecodedMusic = !0
        }
        GetPanningModel() {
            return this._panningModel
        }
        GetDistanceModel() {
            return this._distanceModel
        }
        GetReferenceDistance() {
            return this._refDistance
        }
        GetMaxDistance() {
            return this._maxDistance
        }
        GetRolloffFactor() {
            return this._rolloffFactor
        }
        DecodeAudioData(a, b) {
            return b ? this._iRuntime._WasmDecodeWebMOpus(a).then((a) => {
                const b = this._audioContext["createBuffer"](1, a.length, 48e3),
                    c = b["getChannelData"](0);
                return c.set(a), b
            }) : new Promise((b, c) => {
                this._audioContext["decodeAudioData"](a, b, c)
            })
        }
        TryPlayMedia(a) {
            this._iRuntime.TryPlayMedia(a)
        }
        RemovePendingPlay(a) {
            this._iRuntime.RemovePendingPlay(a)
        }
        ReleaseInstancesForBuffer(b) {
            let c = 0;
            for (let d = 0, a = this._audioInstances.length; d < a; ++d) {
                const e = this._audioInstances[d];
                this._audioInstances[c] = e, e.GetBuffer() === b ? e.Release() : ++c
            }
            this._audioInstances.length = c
        }
        ReleaseAllMusicBuffers() {
            let a = 0;
            for (let c = 0, b = this._audioBuffers.length; c < b; ++c) {
                const d = this._audioBuffers[c];
                this._audioBuffers[a] = d, d.IsMusic() ? d.Release() : ++a
            }
            this._audioBuffers.length = a
        }* audioInstancesByTag(b) {
            if (b)
                for (const c of this._audioInstances) a(c.GetTag(), b) && (yield c);
            else this._lastAudioInstance && !this._lastAudioInstance.HasEnded() && (yield this._lastAudioInstance)
        }
        async _GetAudioBuffer(a, b, c, d, e) {
            for (const f of this._audioBuffers)
                if (f.GetUrl() === b) return await f.Load(), f;
            if (e) return null;
            d && (this._playMusicAsSound || this._hasAnySoftwareDecodedMusic) && this.ReleaseAllMusicBuffers();
            const f = C3AudioBuffer.Create(this, a, b, c, d);
            return this._audioBuffers.push(f), await f.Load(), f
        }
        async _GetAudioInstance(a, b, c, d, e) {
            for (const f of this._audioInstances)
                if (f.GetUrl() === b && (f.CanBeRecycled() || e)) return f.SetTag(d), f;
            const f = await this._GetAudioBuffer(a, b, c, e),
                g = f.CreateInstance(d);
            return this._audioInstances.push(g), g
        }
        _AddPendingTag(a) {
            let b = this._pendingTags.get(a);
            if (!b) {
                let c = null;
                const d = new Promise((a) => c = a);
                b = {
                    pendingCount: 0,
                    promise: d,
                    resolve: c
                }, this._pendingTags.set(a, b)
            }
            b.pendingCount++
        }
        _RemovePendingTag(a) {
            const b = this._pendingTags.get(a);
            if (!b) throw new Error("expected pending tag");
            b.pendingCount--, 0 === b.pendingCount && (b.resolve(), this._pendingTags.delete(a))
        }
        TagReady(a) {
            a || (a = this._lastPlayedTag);
            const b = this._pendingTags.get(a);
            return b ? b.promise : Promise.resolve()
        }
        _MaybeStartTicking() {
            if (0 < this._analysers.size) return void this._StartTicking();
            for (const a of this._audioInstances)
                if (a.IsActive()) return void this._StartTicking()
        }
        Tick() {
            for (const b of this._analysers) b.Tick();
            const a = this.GetAudioCurrentTime();
            for (const b of this._audioInstances) b.Tick(a);
            const b = this._audioInstances.filter((b) => b.IsActive()).map((b) => b.GetState());
            this.PostToRuntime("state", {
                "tickCount": this._lastTickCount,
                "audioInstances": b,
                "analysers": [...this._analysers].map((b) => b.GetData())
            }), 0 === b.length && 0 === this._analysers.size && this._StopTicking()
        }
        PostTrigger(a, b, c) {
            this.PostToRuntime("trigger", {
                "type": a,
                "tag": b,
                "aiid": c
            })
        }
        async _Play(a) {
            const b = a["originalUrl"],
                c = a["url"],
                d = a["type"],
                e = a["isMusic"],
                f = a["tag"],
                g = a["isLooping"],
                h = a["vol"],
                i = a["pos"],
                j = a["panning"];
            let k = a["off"];
            if (0 < k && !a["trueClock"])
                if (this._audioContext["getOutputTimestamp"]) {
                    const a = this._audioContext["getOutputTimestamp"]();
                    k = k - a["performanceTime"] / 1e3 + a["contextTime"]
                } else k = k - performance.now() / 1e3 + this._audioContext["currentTime"];
            this._lastPlayedTag = f, this._AddPendingTag(f);
            try {
                this._lastAudioInstance = await this._GetAudioInstance(b, c, d, f, e), j ? (this._lastAudioInstance.SetPannerEnabled(!0), this._lastAudioInstance.SetPan(j["x"], j["y"], j["angle"], j["innerAngle"], j["outerAngle"], j["outerGain"]), j.hasOwnProperty("uid") && this._lastAudioInstance.SetUID(j["uid"])) : this._lastAudioInstance.SetPannerEnabled(!1), this._lastAudioInstance.Play(g, h, i, k)
            } catch (a) {
                return void console.error("[Construct 3] Audio: error starting playback: ", a)
            } finally {
                this._RemovePendingTag(f)
            }
            this._StartTicking()
        }
        _Stop(a) {
            const b = a["tag"];
            for (const c of this.audioInstancesByTag(b)) c.Stop()
        }
        _StopAll() {
            for (const a of this._audioInstances) a.Stop()
        }
        _SetPaused(a) {
            const b = a["tag"],
                c = a["paused"];
            for (const d of this.audioInstancesByTag(b)) c ? d.Pause() : d.Resume();
            this._MaybeStartTicking()
        }
        _SetVolume(a) {
            const b = a["tag"],
                c = a["vol"];
            for (const d of this.audioInstancesByTag(b)) d.SetVolume(c)
        }
        async _FadeVolume(a) {
            const b = a["tag"],
                c = a["vol"],
                d = a["duration"],
                e = a["stopOnEnd"];
            await this.TagReady(b);
            for (const f of this.audioInstancesByTag(b)) f.FadeVolume(c, d, e);
            this._MaybeStartTicking()
        }
        _SetMasterVolume(a) {
            this._masterVolume = a["vol"];
            for (const b of this._audioInstances) b._UpdateVolume()
        }
        _SetMuted(a) {
            const b = a["tag"],
                c = a["isMuted"];
            for (const d of this.audioInstancesByTag(b)) d.SetMuted(c)
        }
        _SetSilent(a) {
            this._isSilent = a["isSilent"], this._iRuntime.SetSilent(this._isSilent);
            for (const b of this._audioInstances) b._UpdateMuted()
        }
        _SetLooping(a) {
            const b = a["tag"],
                c = a["isLooping"];
            for (const d of this.audioInstancesByTag(b)) d.SetLooping(c)
        }
        async _SetPlaybackRate(a) {
            const b = a["tag"],
                c = a["rate"];
            await this.TagReady(b);
            for (const d of this.audioInstancesByTag(b)) d.SetPlaybackRate(c)
        }
        async _Seek(a) {
            const b = a["tag"],
                c = a["pos"];
            await this.TagReady(b);
            for (const d of this.audioInstancesByTag(b)) d.Seek(c)
        }
        async _Preload(a) {
            const b = a["originalUrl"],
                c = a["url"],
                d = a["type"],
                e = a["isMusic"];
            try {
                await this._GetAudioInstance(b, c, d, "", e)
            } catch (a) {
                console.error("[Construct 3] Audio: error preloading: ", a)
            }
        }
        async _Unload(a) {
            const b = a["url"],
                c = a["type"],
                d = a["isMusic"],
                e = await this._GetAudioBuffer("", b, c, d, !0);
            if (e) {
                e.Release();
                const a = this._audioBuffers.indexOf(e); - 1 !== a && this._audioBuffers.splice(a, 1)
            }
        }
        _UnloadAll() {
            for (const a of this._audioBuffers) a.Release();
            this._audioBuffers.length = 0
        }
        _SetSuspended(a) {
            const b = a["isSuspended"];
            !b && this._audioContext["resume"] && this._audioContext["resume"]();
            for (const c of this._audioInstances) c.SetSuspended(b);
            b && this._audioContext["suspend"] && this._audioContext["suspend"]()
        }
        _OnTick(a) {
            if (this._timeScale = a["timeScale"], this._gameTime = a["gameTime"], this._lastTickCount = a["tickCount"], 0 !== this._timeScaleMode)
                for (const a of this._audioInstances) a._UpdatePlaybackRate();
            const b = a["listenerPos"];
            b && this._audioContext["listener"]["setPosition"](b[0], b[1], b[2]);
            for (const b of a["instPans"]) {
                const a = b["uid"];
                for (const c of this._audioInstances) c.GetUID() === a && c.SetPanXYA(b["x"], b["y"], b["angle"])
            }
        }
        async _AddEffect(a) {
            const b = a["type"],
                c = a["tag"],
                d = a["params"];
            let e;
            if ("filter" === b) e = new C3AudioFilterFX(this, ...d);
            else if ("delay" === b) e = new C3AudioDelayFX(this, ...d);
            else if ("convolution" === b) {
                let b = null;
                try {
                    b = await this._GetAudioBuffer(a["bufferOriginalUrl"], a["bufferUrl"], a["bufferType"], !1)
                } catch (a) {
                    return void console.log("[Construct 3] Audio: error loading convolution: ", a)
                }
                e = new C3AudioConvolveFX(this, b.GetAudioBuffer(), ...d), e._SetBufferInfo(a["bufferOriginalUrl"], a["bufferUrl"], a["bufferType"])
            } else if ("flanger" === b) e = new C3AudioFlangerFX(this, ...d);
            else if ("phaser" === b) e = new C3AudioPhaserFX(this, ...d);
            else if ("gain" === b) e = new C3AudioGainFX(this, ...d);
            else if ("tremolo" === b) e = new C3AudioTremoloFX(this, ...d);
            else if ("ringmod" === b) e = new C3AudioRingModFX(this, ...d);
            else if ("distortion" === b) e = new C3AudioDistortionFX(this, ...d);
            else if ("compressor" === b) e = new C3AudioCompressorFX(this, ...d);
            else if ("analyser" === b) e = new C3AudioAnalyserFX(this, ...d);
            else throw new Error("invalid effect type");
            this.AddEffectForTag(c, e), this._PostUpdatedFxState()
        }
        _SetEffectParam(a) {
            const b = a["tag"],
                c = a["index"],
                d = a["param"],
                e = a["value"],
                f = a["ramp"],
                g = a["time"],
                h = this._effects.get(b);
            !h || 0 > c || c >= h.length || (h[c].SetParam(d, e, f, g), this._PostUpdatedFxState())
        }
        _RemoveEffects(a) {
            const b = a["tag"].toLowerCase(),
                c = this._effects.get(b);
            if (c && c.length) {
                for (const a of c) a.Release();
                this._effects.delete(b), this._ReconnectEffects(b)
            }
        }
        _AddAnalyser(a) {
            this._analysers.add(a), this._MaybeStartTicking()
        }
        _RemoveAnalyser(a) {
            this._analysers.delete(a)
        }
        _PostUpdatedFxState() {
            this._isPendingPostFxState || (this._isPendingPostFxState = !0, Promise.resolve().then(() => this._DoPostUpdatedFxState()))
        }
        _DoPostUpdatedFxState() {
            const a = {};
            for (const [b, c] of this._effects) a[b] = c.map((a) => a.GetState());
            this.PostToRuntime("fxstate", {
                "fxstate": a
            }), this._isPendingPostFxState = !1
        }
        async _OnLoadState(a) {
            const b = a["saveLoadMode"];
            if (3 !== b)
                for (const a of this._audioInstances) a.IsMusic() && 1 === b || !a.IsMusic() && 2 === b || a.Stop();
            for (const b of this._effects.values())
                for (const a of b) a.Release();
            this._effects.clear(), this._timeScale = a["timeScale"], this._gameTime = a["gameTime"];
            const c = a["listenerPos"];
            this._audioContext["listener"]["setPosition"](c[0], c[1], c[2]), this._isSilent = a["isSilent"], this._iRuntime.SetSilent(this._isSilent), this._masterVolume = a["masterVolume"];
            const d = [];
            for (const b of Object.values(a["effects"])) d.push(Promise.all(b.map((a) => this._AddEffect(a))));
            await Promise.all(d), await Promise.all(a["playing"].map((a) => this._LoadAudioInstance(a, b))), this._MaybeStartTicking()
        }
        async _LoadAudioInstance(a, b) {
            if (3 === b) return;
            const c = a["bufferOriginalUrl"],
                d = a["bufferUrl"],
                e = a["bufferType"],
                f = a["isMusic"],
                g = a["tag"],
                h = a["isLooping"],
                i = a["volume"],
                j = a["playbackTime"];
            if (f && 1 === b) return;
            if (!f && 2 === b) return;
            let k = null;
            try {
                k = await this._GetAudioInstance(c, d, e, g, f)
            } catch (a) {
                return void console.error("[Construct 3] Audio: error loading audio state: ", a)
            }
            k.LoadPanState(a["pan"]), k.Play(h, i, j, 0), a["isPlaying"] || k.Pause(), k._LoadAdditionalState(a)
        }
        _OnMicrophoneStream(a, b) {
            this._microphoneSource && this._microphoneSource["disconnect"](), this._microphoneTag = b.toLowerCase(), this._microphoneSource = this._audioContext["createMediaStreamSource"](a), this._microphoneSource["connect"](this.GetDestinationForTag(this._microphoneTag))
        }
        _OnGetOutputStream() {
            return this._destMediaStreamNode || (this._destMediaStreamNode = this._audioContext["createMediaStreamDestination"](), this._destinationNode["connect"](this._destMediaStreamNode)), this._destMediaStreamNode["stream"]
        }
    };
    RuntimeInterface.AddDOMHandlerClass(b)
}
"use strict";
self.C3AudioBuffer = class {
    constructor(a, b, c, d, e) {
        this._audioDomHandler = a, this._originalUrl = b, this._url = c, this._type = d, this._isMusic = e, this._api = "", this._loadState = "not-loaded", this._loadPromise = null
    }
    Release() {
        this._loadState = "not-loaded", this._audioDomHandler = null, this._loadPromise = null
    }
    static Create(a, b, c, d, e) {
        const f = "audio/webm; codecs=opus" === d && !a.SupportsWebMOpus();
        return e && f && a._SetHasAnySoftwareDecodedMusic(), !e || a.IsPlayMusicAsSound() || f ? new C3WebAudioBuffer(a, b, c, d, e, f) : new C3Html5AudioBuffer(a, b, c, d, e)
    }
    CreateInstance(a) {
        return "html5" === this._api ? new C3Html5AudioInstance(this._audioDomHandler, this, a) : new C3WebAudioInstance(this._audioDomHandler, this, a)
    }
    _Load() {}
    Load() {
        return this._loadPromise || (this._loadPromise = this._Load()), this._loadPromise
    }
    IsLoaded() {}
    IsLoadedAndDecoded() {}
    HasFailedToLoad() {
        return "failed" === this._loadState
    }
    GetAudioContext() {
        return this._audioDomHandler.GetAudioContext()
    }
    GetApi() {
        return this._api
    }
    GetOriginalUrl() {
        return this._originalUrl
    }
    GetUrl() {
        return this._url
    }
    GetContentType() {
        return this._type
    }
    IsMusic() {
        return this._isMusic
    }
    GetDuration() {}
};
"use strict";
self.C3Html5AudioBuffer = class extends C3AudioBuffer {
    constructor(a, b, c, d, e) {
        super(a, b, c, d, e), this._api = "html5", this._audioElem = new Audio, this._audioElem.crossOrigin = "anonymous", this._audioElem.autoplay = !1, this._audioElem.preload = "auto", this._loadResolve = null, this._loadReject = null, this._reachedCanPlayThrough = !1, this._audioElem.addEventListener("canplaythrough", () => this._reachedCanPlayThrough = !0), this._outNode = this.GetAudioContext()["createGain"](), this._mediaSourceNode = null, this._audioElem.addEventListener("canplay", () => {
            this._loadResolve && (this._loadState = "loaded", this._loadResolve(), this._loadResolve = null, this._loadReject = null);
            this._mediaSourceNode || !this._audioElem || (this._mediaSourceNode = this.GetAudioContext()["createMediaElementSource"](this._audioElem), this._mediaSourceNode["connect"](this._outNode))
        }), this.onended = null, this._audioElem.addEventListener("ended", () => {
            this.onended && this.onended()
        }), this._audioElem.addEventListener("error", (a) => this._OnError(a))
    }
    Release() {
        this._audioDomHandler.ReleaseInstancesForBuffer(this), this._outNode["disconnect"](), this._outNode = null, this._mediaSourceNode["disconnect"](), this._mediaSourceNode = null, this._audioElem && !this._audioElem.paused && this._audioElem.pause(), this.onended = null, this._audioElem = null, super.Release()
    }
    _Load() {
        return this._loadState = "loading", new Promise((a, b) => {
            this._loadResolve = a, this._loadReject = b, this._audioElem.src = this._url
        })
    }
    _OnError(a) {
        console.error(`[Construct 3] Audio '${this._url}' error: `, a), this._loadReject && (this._loadState = "failed", this._loadReject(a), this._loadResolve = null, this._loadReject = null)
    }
    IsLoaded() {
        const a = 4 <= this._audioElem["readyState"];
        return a && (this._reachedCanPlayThrough = !0), a || this._reachedCanPlayThrough
    }
    IsLoadedAndDecoded() {
        return this.IsLoaded()
    }
    GetAudioElement() {
        return this._audioElem
    }
    GetOutputNode() {
        return this._outNode
    }
    GetDuration() {
        return this._audioElem["duration"]
    }
};
"use strict";
self.C3WebAudioBuffer = class extends C3AudioBuffer {
    constructor(a, b, c, d, e, f) {
        super(a, b, c, d, e), this._api = "webaudio", this._audioData = null, this._audioBuffer = null, this._needsSoftwareDecode = !!f
    }
    Release() {
        this._audioDomHandler.ReleaseInstancesForBuffer(this), this._audioData = null, this._audioBuffer = null, super.Release()
    }
    async _Fetch() {
        if (this._audioData) return this._audioData;
        const a = this._audioDomHandler.GetRuntimeInterface();
        if ("cordova" === a.GetExportType() && a.IsRelativeURL(this._url)) this._audioData = await a.CordovaFetchLocalFileAsArrayBuffer(this._url);
        else {
            const a = await fetch(this._url);
            if (!a.ok) throw new Error(`error fetching audio data: ${a.status} ${a.statusText}`);
            this._audioData = await a.arrayBuffer()
        }
    }
    async _Decode() {
        return this._audioBuffer ? this._audioBuffer : void(this._audioBuffer = await this._audioDomHandler.DecodeAudioData(this._audioData, this._needsSoftwareDecode), this._audioData = null)
    }
    async _Load() {
        try {
            this._loadState = "loading", await this._Fetch(), await this._Decode(), this._loadState = "loaded"
        } catch (a) {
            this._loadState = "failed", console.error(`[Construct 3] Failed to load audio '${this._url}': `, a)
        }
    }
    IsLoaded() {
        return !!(this._audioData || this._audioBuffer)
    }
    IsLoadedAndDecoded() {
        return !!this._audioBuffer
    }
    GetAudioBuffer() {
        return this._audioBuffer
    }
    GetDuration() {
        return this._audioBuffer ? this._audioBuffer["duration"] : 0
    }
};
"use strict"; {
    function a(a) {
        return a * b
    }
    const b = 180 / Math.PI;
    let c = 0;
    self.C3AudioInstance = class {
        constructor(a, b, d) {
            this._audioDomHandler = a, this._buffer = b, this._tag = d, this._aiId = c++, this._gainNode = this.GetAudioContext()["createGain"](), this._gainNode["connect"](this.GetDestinationNode()), this._pannerNode = null, this._isPannerEnabled = !1, this._isStopped = !0, this._isPaused = !1, this._resumeMe = !1, this._isLooping = !1, this._volume = 1, this._isMuted = !1, this._playbackRate = 1;
            const e = this._audioDomHandler.GetTimeScaleMode();
            this._isTimescaled = 1 === e && !this.IsMusic() || 2 === e, this._instUid = -1, this._fadeEndTime = -1, this._stopOnFadeEnd = !1
        }
        Release() {
            this._audioDomHandler = null, this._buffer = null, this._pannerNode && (this._pannerNode["disconnect"](), this._pannerNode = null), this._gainNode["disconnect"](), this._gainNode = null
        }
        GetAudioContext() {
            return this._audioDomHandler.GetAudioContext()
        }
        GetDestinationNode() {
            return this._audioDomHandler.GetDestinationForTag(this._tag)
        }
        GetMasterVolume() {
            return this._audioDomHandler.GetMasterVolume()
        }
        GetCurrentTime() {
            return this._isTimescaled ? this._audioDomHandler.GetGameTime() : performance.now() / 1e3
        }
        GetOriginalUrl() {
            return this._buffer.GetOriginalUrl()
        }
        GetUrl() {
            return this._buffer.GetUrl()
        }
        GetContentType() {
            return this._buffer.GetContentType()
        }
        GetBuffer() {
            return this._buffer
        }
        IsMusic() {
            return this._buffer.IsMusic()
        }
        SetTag(a) {
            this._tag = a
        }
        GetTag() {
            return this._tag
        }
        GetAiId() {
            return this._aiId
        }
        HasEnded() {}
        CanBeRecycled() {}
        IsPlaying() {
            return !this._isStopped && !this._isPaused && !this.HasEnded()
        }
        IsActive() {
            return !this._isStopped && !this.HasEnded()
        }
        GetPlaybackTime() {}
        GetDuration(a) {
            let b = this._buffer.GetDuration();
            return a && (b /= this._playbackRate || .001), b
        }
        Play() {}
        Stop() {}
        Pause() {}
        IsPaused() {
            return this._isPaused
        }
        Resume() {}
        SetVolume(a) {
            this._volume = a, this._gainNode["gain"]["cancelScheduledValues"](0), this._fadeEndTime = -1, this._gainNode["gain"]["value"] = this.GetOverallVolume()
        }
        FadeVolume(a, b, c) {
            if (!this.IsMuted()) {
                a *= this.GetMasterVolume();
                const d = this._gainNode["gain"];
                d["cancelScheduledValues"](0);
                const e = this._audioDomHandler.GetAudioCurrentTime(),
                    f = e + b;
                d["setValueAtTime"](d["value"], e), d["linearRampToValueAtTime"](a, f), this._volume = a, this._fadeEndTime = f, this._stopOnFadeEnd = c
            }
        }
        _UpdateVolume() {
            this.SetVolume(this._volume)
        }
        Tick(a) {
            -1 !== this._fadeEndTime && a >= this._fadeEndTime && (this._fadeEndTime = -1, this._stopOnFadeEnd && this.Stop(), this._audioDomHandler.PostTrigger("fade-ended", this._tag, this._aiId))
        }
        GetOverallVolume() {
            const a = this._volume * this.GetMasterVolume();
            return isFinite(a) ? a : 0
        }
        SetMuted(a) {
            a = !!a;
            this._isMuted === a || (this._isMuted = a, this._UpdateMuted())
        }
        IsMuted() {
            return this._isMuted
        }
        IsSilent() {
            return this._audioDomHandler.IsSilent()
        }
        _UpdateMuted() {}
        SetLooping() {}
        IsLooping() {
            return this._isLooping
        }
        SetPlaybackRate(a) {
            this._playbackRate === a || (this._playbackRate = a, this._UpdatePlaybackRate())
        }
        _UpdatePlaybackRate() {}
        GetPlaybackRate() {
            return this._playbackRate
        }
        Seek() {}
        SetSuspended() {}
        SetPannerEnabled(a) {
            a = !!a;
            this._isPannerEnabled === a || (this._isPannerEnabled = a, this._isPannerEnabled ? (!this._pannerNode && (this._pannerNode = this.GetAudioContext()["createPanner"](), this._pannerNode["panningModel"] = this._audioDomHandler.GetPanningModel(), this._pannerNode["distanceModel"] = this._audioDomHandler.GetDistanceModel(), this._pannerNode["refDistance"] = this._audioDomHandler.GetReferenceDistance(), this._pannerNode["maxDistance"] = this._audioDomHandler.GetMaxDistance(), this._pannerNode["rolloffFactor"] = this._audioDomHandler.GetRolloffFactor()), this._gainNode["disconnect"](), this._gainNode["connect"](this._pannerNode), this._pannerNode["connect"](this.GetDestinationNode())) : (this._pannerNode["disconnect"](), this._gainNode["disconnect"](), this._gainNode["connect"](this.GetDestinationNode())))
        }
        SetPan(b, c, d, e, f, g) {
            this._isPannerEnabled && (this.SetPanXYA(b, c, d), this._pannerNode["coneInnerAngle"] = a(e), this._pannerNode["coneOuterAngle"] = a(f), this._pannerNode["coneOuterGain"] = g)
        }
        SetPanXYA(a, b, c) {
            this._isPannerEnabled && (this._pannerNode["setPosition"](a, b, 0), this._pannerNode["setOrientation"](Math.cos(c), Math.sin(c), 0))
        }
        SetUID(a) {
            this._instUid = a
        }
        GetUID() {
            return this._instUid
        }
        GetResumePosition() {}
        Reconnect(a) {
            const b = this._pannerNode || this._gainNode;
            b["disconnect"](), b["connect"](a)
        }
        GetState() {
            return {
                "aiid": this.GetAiId(),
                "tag": this._tag,
                "duration": this.GetDuration(),
                "volume": this._volume,
                "isPlaying": this.IsPlaying(),
                "playbackTime": this.GetPlaybackTime(),
                "playbackRate": this.GetPlaybackRate(),
                "uid": this._instUid,
                "bufferOriginalUrl": this.GetOriginalUrl(),
                "bufferUrl": "",
                "bufferType": this.GetContentType(),
                "isMusic": this.IsMusic(),
                "isLooping": this.IsLooping(),
                "isMuted": this.IsMuted(),
                "resumePosition": this.GetResumePosition(),
                "pan": this.GetPanState()
            }
        }
        _LoadAdditionalState(a) {
            this.SetPlaybackRate(a["playbackRate"]), this.SetMuted(a["isMuted"])
        }
        GetPanState() {
            if (!this._pannerNode) return null;
            const a = this._pannerNode;
            return {
                "pos": [a["positionX"]["value"], a["positionY"]["value"], a["positionZ"]["value"]],
                "orient": [a["orientationX"]["value"], a["orientationY"]["value"], a["orientationZ"]["value"]],
                "cia": a["coneInnerAngle"],
                "coa": a["coneOuterAngle"],
                "cog": a["coneOuterGain"],
                "uid": this._instUid
            }
        }
        LoadPanState(a) {
            if (!a) return void this.SetPannerEnabled(!1);
            this.SetPannerEnabled(!0);
            const b = this._pannerNode;
            b["setPosition"](...b["pos"]), b["setOrientation"](...b["orient"]), b["coneInnerAngle"] = b["cia"], b["coneOuterAngle"] = b["coa"], b["coneOuterGain"] = b["cog"], this._instUid = b["uid"]
        }
    }
}
"use strict";
self.C3Html5AudioInstance = class extends C3AudioInstance {
    constructor(a, b, c) {
        super(a, b, c), this._buffer.GetOutputNode()["connect"](this._gainNode), this._buffer.onended = () => this._OnEnded()
    }
    Release() {
        this.Stop(), this._buffer.GetOutputNode()["disconnect"](), super.Release()
    }
    GetAudioElement() {
        return this._buffer.GetAudioElement()
    }
    _OnEnded() {
        this._isStopped = !0, this._instUid = -1, this._audioDomHandler.PostTrigger("ended", this._tag, this._aiId)
    }
    HasEnded() {
        return this.GetAudioElement()["ended"]
    }
    CanBeRecycled() {
        return !!this._isStopped || this.HasEnded()
    }
    GetPlaybackTime(a) {
        let b = this.GetAudioElement()["currentTime"];
        return a && (b *= this._playbackRate), this._isLooping || (b = Math.min(b, this.GetDuration())), b
    }
    Play(a, b, c) {
        const d = this.GetAudioElement();
        if (1 !== d.playbackRate && (d.playbackRate = 1), d.loop !== a && (d.loop = a), this.SetVolume(b), d.muted && (d.muted = !1), d.currentTime !== c) try {
            d.currentTime = c
        } catch (a) {
            console.warn(`[Construct 3] Exception seeking audio '${this._buffer.GetUrl()}' to position '${c}': `, a)
        }
        this._audioDomHandler.TryPlayMedia(d), this._isStopped = !1, this._isPaused = !1, this._isLooping = a, this._playbackRate = 1
    }
    Stop() {
        const a = this.GetAudioElement();
        a.paused || a.pause(), this._audioDomHandler.RemovePendingPlay(a), this._isStopped = !0, this._isPaused = !1, this._instUid = -1
    }
    Pause() {
        if (!(this._isPaused || this._isStopped || this.HasEnded())) {
            const a = this.GetAudioElement();
            a.paused || a.pause(), this._audioDomHandler.RemovePendingPlay(a), this._isPaused = !0
        }
    }
    Resume() {
        !this._isPaused || this._isStopped || this.HasEnded() || (this._audioDomHandler.TryPlayMedia(this.GetAudioElement()), this._isPaused = !1)
    }
    _UpdateMuted() {
        this.GetAudioElement().muted = this._isMuted || this.IsSilent()
    }
    SetLooping(a) {
        a = !!a;
        this._isLooping === a || (this._isLooping = a, this.GetAudioElement().loop = a)
    }
    _UpdatePlaybackRate() {
        let a = this._playbackRate;
        this._isTimescaled && (a *= this._audioDomHandler.GetTimeScale());
        try {
            this.GetAudioElement()["playbackRate"] = a
        } catch (b) {
            console.warn(`[Construct 3] Unable to set playback rate '${a}':`, b)
        }
    }
    Seek(a) {
        if (!(this._isStopped || this.HasEnded())) try {
            this.GetAudioElement()["currentTime"] = a
        } catch (b) {
            console.warn(`[Construct 3] Error seeking audio to '${a}': `, b)
        }
    }
    GetResumePosition() {
        return this.GetPlaybackTime()
    }
    SetSuspended(a) {
        a ? this.IsPlaying() ? (this.GetAudioElement()["pause"](), this._resumeMe = !0) : this._resumeMe = !1 : this._resumeMe && (this._audioDomHandler.TryPlayMedia(this.GetAudioElement()), this._resumeMe = !1)
    }
};
"use strict";
self.C3WebAudioInstance = class extends C3AudioInstance {
    constructor(a, b, c) {
        super(a, b, c), this._bufferSource = null, this._onended_handler = (a) => this._OnEnded(a), this._hasPlaybackEnded = !0, this._activeSource = null, this._startTime = 0, this._resumePosition = 0, this._muteVol = 1
    }
    Release() {
        this.Stop(), this._ReleaseBufferSource(), this._onended_handler = null, super.Release()
    }
    _ReleaseBufferSource() {
        this._bufferSource && this._bufferSource["disconnect"](), this._bufferSource = null, this._activeSource = null
    }
    _OnEnded(a) {
        this._isPaused || this._resumeMe || a.target !== this._activeSource || (this._hasPlaybackEnded = !0, this._isStopped = !0, this._instUid = -1, this._ReleaseBufferSource(), this._audioDomHandler.PostTrigger("ended", this._tag, this._aiId))
    }
    HasEnded() {
        return !(!this._isStopped && this._bufferSource && this._bufferSource["loop"]) && !this._isPaused && this._hasPlaybackEnded
    }
    CanBeRecycled() {
        return !(this._bufferSource && !this._isStopped) || this.HasEnded()
    }
    GetPlaybackTime(a) {
        let b = 0;
        return b = this._isPaused ? this._resumePosition : this.GetCurrentTime() - this._startTime, a && (b *= this._playbackRate), this._isLooping || (b = Math.min(b, this.GetDuration())), b
    }
    Play(a, b, c, d) {
        this._muteVol = 1, this.SetVolume(b), this._ReleaseBufferSource(), this._bufferSource = this.GetAudioContext()["createBufferSource"](), this._bufferSource["buffer"] = this._buffer.GetAudioBuffer(), this._bufferSource["connect"](this._gainNode), this._activeSource = this._bufferSource, this._bufferSource["onended"] = this._onended_handler, this._bufferSource["loop"] = a, this._bufferSource["start"](d, c), this._hasPlaybackEnded = !1, this._isStopped = !1, this._isPaused = !1, this._isLooping = a, this._playbackRate = 1, this._startTime = this.GetCurrentTime() - c
    }
    Stop() {
        this._bufferSource && this._bufferSource["stop"](0), this._isStopped = !0, this._isPaused = !1, this._instUid = -1
    }
    Pause() {
        this._isPaused || this._isStopped || this.HasEnded() || (this._resumePosition = this.GetPlaybackTime(!0), this._isLooping && (this._resumePosition %= this.GetDuration()), this._isPaused = !0, this._bufferSource["stop"](0))
    }
    Resume() {
        !this._isPaused || this._isStopped || this.HasEnded() || (this._ReleaseBufferSource(), this._bufferSource = this.GetAudioContext()["createBufferSource"](), this._bufferSource["buffer"] = this._buffer.GetAudioBuffer(), this._bufferSource["connect"](this._gainNode), this._activeSource = this._bufferSource, this._bufferSource["onended"] = this._onended_handler, this._bufferSource["loop"] = this._isLooping, this._UpdateVolume(), this._UpdatePlaybackRate(), this._startTime = this.GetCurrentTime() - this._resumePosition / (this._playbackRate || .001), this._bufferSource["start"](0, this._resumePosition), this._isPaused = !1)
    }
    GetOverallVolume() {
        return super.GetOverallVolume() * this._muteVol
    }
    _UpdateMuted() {
        this._muteVol = this._isMuted || this.IsSilent() ? 0 : 1, this._UpdateVolume()
    }
    SetLooping(a) {
        a = !!a;
        this._isLooping === a || (this._isLooping = a, this._bufferSource && (this._bufferSource["loop"] = a))
    }
    _UpdatePlaybackRate() {
        let a = this._playbackRate;
        this._isTimescaled && (a *= this._audioDomHandler.GetTimeScale()), this._bufferSource && (this._bufferSource["playbackRate"]["value"] = a)
    }
    Seek(a) {
        this._isStopped || this.HasEnded() || (this._isPaused ? this._resumePosition = a : (this.Pause(), this._resumePosition = a, this.Resume()))
    }
    GetResumePosition() {
        return this._resumePosition
    }
    SetSuspended(a) {
        a ? this.IsPlaying() ? (this._resumeMe = !0, this._resumePosition = this.GetPlaybackTime(!0), this._isLooping && (this._resumePosition %= this.GetDuration()), this._bufferSource["stop"](0)) : this._resumeMe = !1 : this._resumeMe && (this._ReleaseBufferSource(), this._bufferSource = this.GetAudioContext()["createBufferSource"](), this._bufferSource["buffer"] = this._buffer.GetAudioBuffer(), this._bufferSource["connect"](this._gainNode), this._activeSource = this._bufferSource, this._bufferSource["onended"] = this._onended_handler, this._bufferSource["loop"] = this._isLooping, this._UpdateVolume(), this._UpdatePlaybackRate(), this._startTime = this.GetCurrentTime() - this._resumePosition / (this._playbackRate || .001), this._bufferSource["start"](0, this._resumePosition), this._resumeMe = !1)
    }
    _LoadAdditionalState(a) {
        super._LoadAdditionalState(a), this._resumePosition = a["resumePosition"]
    }
};
"use strict"; {
    function a(a) {
        return Math.pow(10, a / 20)
    }

    function b(b) {
        return Math.max(Math.min(a(b), 1), 0)
    }

    function c(a) {
        return 20 * (Math.log(a) / 2.302585092994046)
    }

    function d(a) {
        return c(Math.max(Math.min(a, 1), 0))
    }

    function e(a, b) {
        return 1 - Math.exp(-b * a)
    }
    class f {
        constructor(a) {
            this._audioDomHandler = a, this._audioContext = a.GetAudioContext(), this._index = -1, this._tag = "", this._type = "", this._params = null
        }
        Release() {
            this._audioContext = null
        }
        _SetIndex(a) {
            this._index = a
        }
        GetIndex() {
            return this._index
        }
        _SetTag(a) {
            this._tag = a
        }
        GetTag() {
            return this._tag
        }
        CreateGain() {
            return this._audioContext["createGain"]()
        }
        GetInputNode() {}
        ConnectTo() {}
        SetAudioParam(a, b, c, d) {
            if (a["cancelScheduledValues"](0), 0 === d) return void(a["value"] = b);
            const e = this._audioContext["currentTime"];
            d += e, 0 === c ? a["setValueAtTime"](b, d) : 1 === c ? (a["setValueAtTime"](a["value"], e), a["linearRampToValueAtTime"](b, d)) : 2 === c ? (a["setValueAtTime"](a["value"], e), a["exponentialRampToValueAtTime"](b, d)) : void 0
        }
        GetState() {
            return {
                "type": this._type,
                "tag": this._tag,
                "params": this._params
            }
        }
    }
    self.C3AudioFilterFX = class extends f {
        constructor(a, b, c, d, e, f, g) {
            super(a), this._type = "filter", this._params = [b, c, d, e, f, g], this._inputNode = this.CreateGain(), this._wetNode = this.CreateGain(), this._wetNode["gain"]["value"] = g, this._dryNode = this.CreateGain(), this._dryNode["gain"]["value"] = 1 - g, this._filterNode = this._audioContext["createBiquadFilter"](), this._filterNode["type"] = b, this._filterNode["frequency"]["value"] = c, this._filterNode["detune"]["value"] = d, this._filterNode["Q"]["value"] = e, this._filterNode["gain"]["vlaue"] = f, this._inputNode["connect"](this._filterNode), this._inputNode["connect"](this._dryNode), this._filterNode["connect"](this._wetNode)
        }
        Release() {
            this._inputNode["disconnect"](), this._filterNode["disconnect"](), this._wetNode["disconnect"](), this._dryNode["disconnect"](), super.Release()
        }
        ConnectTo(a) {
            this._wetNode["disconnect"](), this._wetNode["connect"](a), this._dryNode["disconnect"](), this._dryNode["connect"](a)
        }
        GetInputNode() {
            return this._inputNode
        }
        SetParam(a, b, c, d) {
            0 === a ? (b = Math.max(Math.min(b / 100, 1), 0), this._params[5] = b, this.SetAudioParam(this._wetNode["gain"], b, c, d), this.SetAudioParam(this._dryNode["gain"], 1 - b, c, d)) : 1 === a ? (this._params[1] = b, this.SetAudioParam(this._filterNode["frequency"], b, c, d)) : 2 === a ? (this._params[2] = b, this.SetAudioParam(this._filterNode["detune"], b, c, d)) : 3 === a ? (this._params[3] = b, this.SetAudioParam(this._filterNode["Q"], b, c, d)) : 4 === a ? (this._params[4] = b, this.SetAudioParam(this._filterNode["gain"], b, c, d)) : void 0
        }
    }, self.C3AudioDelayFX = class extends f {
        constructor(a, b, c, d) {
            super(a), this._type = "delay", this._params = [b, c, d], this._inputNode = this.CreateGain(), this._wetNode = this.CreateGain(), this._wetNode["gain"]["value"] = d, this._dryNode = this.CreateGain(), this._dryNode["gain"]["value"] = 1 - d, this._mainNode = this.CreateGain(), this._delayNode = this._audioContext["createDelay"](b), this._delayNode["delayTime"]["value"] = b, this._delayGainNode = this.CreateGain(), this._delayGainNode["gain"]["value"] = c, this._inputNode["connect"](this._mainNode), this._inputNode["connect"](this._dryNode), this._mainNode["connect"](this._wetNode), this._mainNode["connect"](this._delayNode), this._delayNode["connect"](this._delayGainNode), this._delayGainNode["connect"](this._mainNode)
        }
        Release() {
            this._inputNode["disconnect"](), this._wetNode["disconnect"](), this._dryNode["disconnect"](), this._mainNode["disconnect"](), this._delayNode["disconnect"](), this._delayGainNode["disconnect"](), super.Release()
        }
        ConnectTo(a) {
            this._wetNode["disconnect"](), this._wetNode["connect"](a), this._dryNode["disconnect"](), this._dryNode["connect"](a)
        }
        GetInputNode() {
            return this._inputNode
        }
        SetParam(a, c, d, e) {
            0 === a ? (c = Math.max(Math.min(c / 100, 1), 0), this._params[2] = c, this.SetAudioParam(this._wetNode["gain"], c, d, e), this.SetAudioParam(this._dryNode["gain"], 1 - c, d, e)) : 4 === a ? (this._params[1] = b(c), this.SetAudioParam(this._delayGainNode["gain"], b(c), d, e)) : 5 === a ? (this._params[0] = c, this.SetAudioParam(this._delayNode["delayTime"], c, d, e)) : void 0
        }
    }, self.C3AudioConvolveFX = class extends f {
        constructor(a, b, c, d) {
            super(a), this._type = "convolution", this._params = [c, d], this._bufferOriginalUrl = "", this._bufferUrl = "", this._bufferType = "", this._inputNode = this.CreateGain(), this._wetNode = this.CreateGain(), this._wetNode["gain"]["value"] = d, this._dryNode = this.CreateGain(), this._dryNode["gain"]["value"] = 1 - d, this._convolveNode = this._audioContext["createConvolver"](), this._convolveNode["normalize"] = c, this._convolveNode["buffer"] = b, this._inputNode["connect"](this._convolveNode), this._inputNode["connect"](this._dryNode), this._convolveNode["connect"](this._wetNode)
        }
        Release() {
            this._inputNode["disconnect"](), this._convolveNode["disconnect"](), this._wetNode["disconnect"](), this._dryNode["disconnect"](), super.Release()
        }
        ConnectTo(a) {
            this._wetNode["disconnect"](), this._wetNode["connect"](a), this._dryNode["disconnect"](), this._dryNode["connect"](a)
        }
        GetInputNode() {
            return this._inputNode
        }
        SetParam(a, b, c, d) {
            0 === a ? (b = Math.max(Math.min(b / 100, 1), 0), this._params[1] = b, this.SetAudioParam(this._wetNode["gain"], b, c, d), this.SetAudioParam(this._dryNode["gain"], 1 - b, c, d)) : void 0
        }
        _SetBufferInfo(a, b, c) {
            this._bufferOriginalUrl = a, this._bufferUrl = b, this._bufferType = c
        }
        GetState() {
            const a = super.GetState();
            return a["bufferOriginalUrl"] = this._bufferOriginalUrl, a["bufferUrl"] = "", a["bufferType"] = this._bufferType, a
        }
    }, self.C3AudioFlangerFX = class extends f {
        constructor(a, b, c, d, e, f) {
            super(a), this._type = "flanger", this._params = [b, c, d, e, f], this._inputNode = this.CreateGain(), this._dryNode = this.CreateGain(), this._dryNode["gain"]["value"] = 1 - f / 2, this._wetNode = this.CreateGain(), this._wetNode["gain"]["value"] = f / 2, this._feedbackNode = this.CreateGain(), this._feedbackNode["gain"]["value"] = e, this._delayNode = this._audioContext["createDelay"](b + c), this._delayNode["delayTime"]["value"] = b, this._oscNode = this._audioContext["createOscillator"](), this._oscNode["frequency"]["value"] = d, this._oscGainNode = this.CreateGain(), this._oscGainNode["gain"]["value"] = c, this._inputNode["connect"](this._delayNode), this._inputNode["connect"](this._dryNode), this._delayNode["connect"](this._wetNode), this._delayNode["connect"](this._feedbackNode), this._feedbackNode["connect"](this._delayNode), this._oscNode["connect"](this._oscGainNode), this._oscGainNode["connect"](this._delayNode["delayTime"]), this._oscNode["start"](0)
        }
        Release() {
            this._oscNode["stop"](0), this._inputNode["disconnect"](), this._delayNode["disconnect"](), this._oscNode["disconnect"](), this._oscGainNode["disconnect"](), this._dryNode["disconnect"](), this._wetNode["disconnect"](), this._feedbackNode["disconnect"](), super.Release()
        }
        ConnectTo(a) {
            this._wetNode["disconnect"](), this._wetNode["connect"](a), this._dryNode["disconnect"](), this._dryNode["connect"](a)
        }
        GetInputNode() {
            return this._inputNode
        }
        SetParam(a, b, c, d) {
            0 === a ? (b = Math.max(Math.min(b / 100, 1), 0), this._params[4] = b, this.SetAudioParam(this._wetNode["gain"], b / 2, c, d), this.SetAudioParam(this._dryNode["gain"], 1 - b / 2, c, d)) : 6 === a ? (this._params[1] = b / 1e3, this.SetAudioParam(this._oscGainNode["gain"], b / 1e3, c, d)) : 7 === a ? (this._params[2] = b, this.SetAudioParam(this._oscNode["frequency"], b, c, d)) : 8 === a ? (this._params[3] = b / 100, this.SetAudioParam(this._feedbackNode["gain"], b / 100, c, d)) : void 0
        }
    }, self.C3AudioPhaserFX = class extends f {
        constructor(a, b, c, d, e, f, g) {
            super(a), this._type = "phaser", this._params = [b, c, d, e, f, g], this._inputNode = this.CreateGain(), this._dryNode = this.CreateGain(), this._dryNode["gain"]["value"] = 1 - g / 2, this._wetNode = this.CreateGain(), this._wetNode["gain"]["value"] = g / 2, this._filterNode = this._audioContext["createBiquadFilter"](), this._filterNode["type"] = "allpass", this._filterNode["frequency"]["value"] = b, this._filterNode["detune"]["value"] = c, this._filterNode["Q"]["value"] = d, this._oscNode = this._audioContext["createOscillator"](), this._oscNode["frequency"]["value"] = f, this._oscGainNode = this.CreateGain(), this._oscGainNode["gain"]["value"] = e, this._inputNode["connect"](this._filterNode), this._inputNode["connect"](this._dryNode), this._filterNode["connect"](this._wetNode), this._oscNode["connect"](this._oscGainNode), this._oscGainNode["connect"](this._filterNode["frequency"]), this._oscNode["start"](0)
        }
        Release() {
            this._oscNode["stop"](0), this._inputNode["disconnect"](), this._filterNode["disconnect"](), this._oscNode["disconnect"](), this._oscGainNode["disconnect"](), this._dryNode["disconnect"](), this._wetNode["disconnect"](), super.Release()
        }
        ConnectTo(a) {
            this._wetNode["disconnect"](), this._wetNode["connect"](a), this._dryNode["disconnect"](), this._dryNode["connect"](a)
        }
        GetInputNode() {
            return this._inputNode
        }
        SetParam(a, b, c, d) {
            0 === a ? (b = Math.max(Math.min(b / 100, 1), 0), this._params[5] = b, this.SetAudioParam(this._wetNode["gain"], b / 2, c, d), this.SetAudioParam(this._dryNode["gain"], 1 - b / 2, c, d)) : 1 === a ? (this._params[0] = b, this.SetAudioParam(this._filterNode["frequency"], b, c, d)) : 2 === a ? (this._params[1] = b, this.SetAudioParam(this._filterNode["detune"], b, c, d)) : 3 === a ? (this._params[2] = b, this.SetAudioParam(this._filterNode["Q"], b, c, d)) : 6 === a ? (this._params[3] = b, this.SetAudioParam(this._oscGainNode["gain"], b, c, d)) : 7 === a ? (this._params[4] = b, this.SetAudioParam(this._oscNode["frequency"], b, c, d)) : void 0
        }
    }, self.C3AudioGainFX = class extends f {
        constructor(a, b) {
            super(a), this._type = "gain", this._params = [b], this._node = this.CreateGain(), this._node["gain"]["value"] = b
        }
        Release() {
            this._node["disconnect"](), super.Release()
        }
        ConnectTo(a) {
            this._node["disconnect"](), this._node["connect"](a)
        }
        GetInputNode() {
            return this._node
        }
        SetParam(a, c, d, e) {
            4 === a ? (this._params[0] = b(c), this.SetAudioParam(this._node["gain"], b(c), d, e)) : void 0
        }
    }, self.C3AudioTremoloFX = class extends f {
        constructor(a, b, c) {
            super(a), this._type = "tremolo", this._params = [b, c], this._node = this.CreateGain(), this._node["gain"]["value"] = 1 - c / 2, this._oscNode = this._audioContext["createOscillator"](), this._oscNode["frequency"]["value"] = b, this._oscGainNode = this.CreateGain(), this._oscGainNode["gain"]["value"] = c / 2, this._oscNode["connect"](this._oscGainNode), this._oscGainNode["connect"](this._node["gain"]), this._oscNode["start"](0)
        }
        Release() {
            this._oscNode["stop"](0), this._oscNode["disconnect"](), this._oscGainNode["disconnect"](), this._node["disconnect"](), super.Release()
        }
        ConnectTo(a) {
            this._node["disconnect"](), this._node["connect"](a)
        }
        GetInputNode() {
            return this._node
        }
        SetParam(a, b, c, d) {
            0 === a ? (b = Math.max(Math.min(b / 100, 1), 0), this._params[1] = b, this.SetAudioParam(this._node["gain"]["value"], 1 - b / 2, c, d), this.SetAudioParam(this._oscGainNode["gain"]["value"], b / 2, c, d)) : 7 === a ? (this._params[0] = b, this.SetAudioParam(this._oscNode["frequency"], b, c, d)) : void 0
        }
    }, self.C3AudioRingModFX = class extends f {
        constructor(a, b, c) {
            super(a), this._type = "ringmod", this._params = [b, c], this._inputNode = this.CreateGain(), this._wetNode = this.CreateGain(), this._wetNode["gain"]["value"] = c, this._dryNode = this.CreateGain(), this._dryNode["gain"]["value"] = 1 - c, this._ringNode = this.CreateGain(), this._ringNode["gain"]["value"] = 0, this._oscNode = this._audioContext["createOscillator"](), this._oscNode["frequency"]["value"] = b, this._oscNode["connect"](this._ringNode["gain"]), this._oscNode["start"](0), this._inputNode["connect"](this._ringNode), this._inputNode["connect"](this._dryNode), this._ringNode["connect"](this._wetNode)
        }
        Release() {
            this._oscNode["stop"](0), this._oscNode["disconnect"](), this._ringNode["disconnect"](), this._inputNode["disconnect"](), this._wetNode["disconnect"](), this._dryNode["disconnect"](), super.Release()
        }
        ConnectTo(a) {
            this._wetNode["disconnect"](), this._wetNode["connect"](a), this._dryNode["disconnect"](), this._dryNode["connect"](a)
        }
        GetInputNode() {
            return this._inputNode
        }
        SetParam(a, b, c, d) {
            0 === a ? (b = Math.max(Math.min(b / 100, 1), 0), this._params[1] = b, this.SetAudioParam(this._wetNode["gain"], b, c, d), this.SetAudioParam(this._dryNode["gain"], 1 - b, c, d)) : 7 === a ? (this._params[0] = b, this.SetAudioParam(this._oscNode["frequency"], b, c, d)) : void 0
        }
    }, self.C3AudioDistortionFX = class extends f {
        constructor(a, b, c, d, e, f) {
            super(a), this._type = "distortion", this._params = [b, c, d, e, f], this._inputNode = this.CreateGain(), this._preGain = this.CreateGain(), this._postGain = this.CreateGain(), this._SetDrive(d, e), this._wetNode = this.CreateGain(), this._wetNode["gain"]["value"] = f, this._dryNode = this.CreateGain(), this._dryNode["gain"]["value"] = 1 - f, this._waveShaper = this._audioContext["createWaveShaper"](), this._curve = new Float32Array(65536), this._GenerateColortouchCurve(b, c), this._waveShaper.curve = this._curve, this._inputNode["connect"](this._preGain), this._inputNode["connect"](this._dryNode), this._preGain["connect"](this._waveShaper), this._waveShaper["connect"](this._postGain), this._postGain["connect"](this._wetNode)
        }
        Release() {
            this._inputNode["disconnect"](), this._preGain["disconnect"](), this._waveShaper["disconnect"](), this._postGain["disconnect"](), this._wetNode["disconnect"](), this._dryNode["disconnect"](), super.Release()
        }
        _SetDrive(a, b) {
            .01 > a && (a = .01), this._preGain["gain"]["value"] = a, this._postGain["gain"]["value"] = Math.pow(1 / a, .6) * b
        }
        _GenerateColortouchCurve(a, b) {
            for (let c, d = 0; d < 32768; ++d) c = d / 32768, c = this._Shape(c, a, b), this._curve[32768 + d] = c, this._curve[32768 - d - 1] = -c
        }
        _Shape(a, b, c) {
            const d = 1.05 * c * b - b,
                f = 0 > a ? -1 : 1,
                g = 0 > a ? -a : a;
            let h = g < b ? g : b + d * e(g - b, 1 / d);
            return h *= f, h
        }
        ConnectTo(a) {
            this._wetNode["disconnect"](), this._wetNode["connect"](a), this._dryNode["disconnect"](), this._dryNode["connect"](a)
        }
        GetInputNode() {
            return this._inputNode
        }
        SetParam(a, b, c, d) {
            0 === a ? (b = Math.max(Math.min(b / 100, 1), 0), this._params[4] = b, this.SetAudioParam(this._wetNode["gain"], b, c, d), this.SetAudioParam(this._dryNode["gain"], 1 - b, c, d)) : void 0
        }
    }, self.C3AudioCompressorFX = class extends f {
        constructor(a, b, c, d, e, f) {
            super(a), this._type = "compressor", this._params = [b, c, d, e, f], this._node = this._audioContext["createDynamicsCompressor"](), this._node["threshold"]["value"] = b, this._node["knee"]["value"] = c, this._node["ratio"]["value"] = d, this._node["attack"]["value"] = e, this._node["release"]["value"] = f
        }
        Release() {
            this._node["disconnect"](), super.Release()
        }
        ConnectTo(a) {
            this._node["disconnect"](), this._node["connect"](a)
        }
        GetInputNode() {
            return this._node
        }
        SetParam() {}
    }, self.C3AudioAnalyserFX = class extends f {
        constructor(a, b, c) {
            super(a), this._type = "analyser", this._params = [b, c], this._node = this._audioContext["createAnalyser"](), this._node["fftSize"] = b, this._node["smoothingTimeConstant"] = c, this._freqBins = new Float32Array(this._node["frequencyBinCount"]), this._signal = new Uint8Array(b), this._peak = 0, this._rms = 0, this._audioDomHandler._AddAnalyser(this)
        }
        Release() {
            this._audioDomHandler._RemoveAnalyser(this), this._node["disconnect"](), super.Release()
        }
        Tick() {
            this._node["getFloatFrequencyData"](this._freqBins), this._node["getByteTimeDomainData"](this._signal);
            const a = this._node["fftSize"];
            this._peak = 0;
            let b = 0;
            for (let c, d = 0; d < a; ++d) c = (this._signal[d] - 128) / 128, 0 > c && (c = -c), this._peak < c && (this._peak = c), b += c * c;
            this._peak = d(this._peak), this._rms = d(Math.sqrt(b / a))
        }
        ConnectTo(a) {
            this._node["disconnect"](), this._node["connect"](a)
        }
        GetInputNode() {
            return this._node
        }
        SetParam() {}
        GetData() {
            return {
                "tag": this.GetTag(),
                "index": this.GetIndex(),
                "peak": this._peak,
                "rms": this._rms,
                "binCount": this._node["frequencyBinCount"],
                "freqBins": this._freqBins
            }
        }
    }
}
"use strict"; {
    const a = class extends DOMHandler {
        constructor(a) {
            super(a, "browser"), this._exportType = "", this.AddRuntimeMessageHandlers([
                ["get-initial-state", (a) => this._OnGetInitialState(a)],
                ["ready-for-sw-messages", () => this._OnReadyForSWMessages()],
                ["alert", (a) => this._OnAlert(a)],
                ["close", () => this._OnClose()],
                ["set-focus", (a) => this._OnSetFocus(a)],
                ["vibrate", (a) => this._OnVibrate(a)],
                ["lock-orientation", (a) => this._OnLockOrientation(a)],
                ["unlock-orientation", () => this._OnUnlockOrientation()],
                ["navigate", (a) => this._OnNavigate(a)],
                ["request-fullscreen", (a) => this._OnRequestFullscreen(a)],
                ["exit-fullscreen", () => this._OnExitFullscreen()],
                ["set-hash", (a) => this._OnSetHash(a)]
            ]), window.addEventListener("online", () => this._OnOnlineStateChanged(!0)), window.addEventListener("offline", () => this._OnOnlineStateChanged(!1)), window.addEventListener("hashchange", () => this._OnHashChange()), document.addEventListener("backbutton", () => this._OnCordovaBackButton()), "undefined" != typeof Windows && Windows["UI"]["Core"]["SystemNavigationManager"]["getForCurrentView"]().addEventListener("backrequested", (a) => this._OnWin10BackRequested(a))
        }
        _OnGetInitialState(a) {
            return this._exportType = a["exportType"], {
                "location": location.toString(),
                "isOnline": !!navigator.onLine,
                "referrer": document.referrer,
                "title": document.title,
                "isCookieEnabled": !!navigator.cookieEnabled,
                "screenWidth": screen.width,
                "screenHeight": screen.height,
                "windowOuterWidth": window.outerWidth,
                "windowOuterHeight": window.outerHeight,
                "isScirraArcade": "undefined" != typeof window["is_scirra_arcade"]
            }
        }
        _OnReadyForSWMessages() {
            window["C3_RegisterSW"] && window["OfflineClientInfo"] && window["OfflineClientInfo"]["SetMessageCallback"]((a) => this.PostToRuntime("sw-message", a["data"]))
        }
        _OnOnlineStateChanged(a) {
            this.PostToRuntime("online-state", {
                "isOnline": a
            })
        }
        _OnCordovaBackButton() {
            this.PostToRuntime("backbutton")
        }
        _OnWin10BackRequested(a) {
            a["handled"] = !0, this.PostToRuntime("backbutton")
        }
        GetNWjsWindow() {
            return "nwjs" === this._exportType ? nw["Window"]["get"]() : null
        }
        _OnAlert(a) {
            alert(a["message"])
        }
        _OnClose() {
            navigator["app"] && navigator["app"]["exitApp"] ? navigator["app"]["exitApp"]() : navigator["device"] && navigator["device"]["exitApp"] ? navigator["device"]["exitApp"]() : window.close()
        }
        _OnSetFocus(a) {
            const b = a["isFocus"];
            if ("nwjs" === this._exportType) {
                const a = this.GetNWjsWindow();
                b ? a["focus"]() : a["blur"]()
            } else b ? window.focus() : window.blur()
        }
        _OnVibrate(a) {
            navigator["vibrate"] && navigator["vibrate"](a["pattern"])
        }
        _OnLockOrientation(a) {
            const b = a["orientation"];
            if (screen["orientation"] && screen["orientation"]["lock"]) screen["orientation"]["lock"](b).catch((a) => console.warn("[Construct 3] Failed to lock orientation: ", a));
            else try {
                let a = !1;
                screen["lockOrientation"] ? a = screen["lockOrientation"](b) : screen["webkitLockOrientation"] ? a = screen["webkitLockOrientation"](b) : screen["mozLockOrientation"] ? a = screen["mozLockOrientation"](b) : screen["msLockOrientation"] && (a = screen["msLockOrientation"](b)), a || console.warn("[Construct 3] Failed to lock orientation")
            } catch (a) {
                console.warn("[Construct 3] Failed to lock orientation: ", a)
            }
        }
        _OnUnlockOrientation() {
            try {
                screen["orientation"] && screen["orientation"]["unlock"] ? screen["orientation"]["unlock"]() : screen["unlockOrientation"] ? screen["unlockOrientation"]() : screen["webkitUnlockOrientation"] ? screen["webkitUnlockOrientation"]() : screen["mozUnlockOrientation"] ? screen["mozUnlockOrientation"]() : screen["msUnlockOrientation"] && screen["msUnlockOrientation"]()
            } catch (a) {}
        }
        _OnNavigate(a) {
            const b = a["type"];
            if ("back" === b) navigator["app"] && navigator["app"]["backHistory"] ? navigator["app"]["backHistory"]() : window.back();
            else if ("forward" === b) window.forward();
            else if ("home" === b) window.home();
            else if ("reload" === b) location.reload();
            else if ("url" === b) {
                const b = a["url"],
                    c = a["target"],
                    d = a["exportType"];
                "windows-uwp" === d && "undefined" != typeof Windows ? Windows["System"]["Launcher"]["launchUriAsync"](new Windows["Foundation"]["Uri"](b)) : "cordova" === d ? window.open(b, "_system") : "preview" === d ? window.open(b, "_blank") : !this._isScirraArcade && (2 === c ? window.top.location = b : 1 === c ? window.parent.location = b : window.location = b)
            } else if ("new-window" === b) {
                const b = a["url"],
                    c = a["tag"],
                    d = a["exportType"];
                "windows-uwp" === d && "undefined" != typeof Windows ? Windows["System"]["Launcher"]["launchUriAsync"](new Windows["Foundation"]["Uri"](b)) : "cordova" === d ? window.open(b, "_system") : window.open(b, c)
            }
        }
        _OnRequestFullscreen(a) {
            const b = {
                    "navigationUI": "auto"
                },
                c = a["navUI"];
            1 === c ? b["navigationUI"] = "hide" : 2 === c && (b["navigationUI"] = "show");
            const d = document.documentElement;
            d["requestFullscreen"] ? d["requestFullscreen"](b) : d["mozRequestFullScreen"] ? d["mozRequestFullScreen"](b) : d["msRequestFullscreen"] ? d["msRequestFullscreen"](b) : d["webkitRequestFullScreen"] && ("undefined" == typeof Element["ALLOW_KEYBOARD_INPUT"] ? d["webkitRequestFullScreen"]() : d["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"]))
        }
        _OnExitFullscreen() {
            document["exitFullscreen"] ? document["exitFullscreen"]() : document["mozCancelFullScreen"] ? document["mozCancelFullScreen"]() : document["msExitFullscreen"] ? document["msExitFullscreen"]() : document["webkitCancelFullScreen"] && document["webkitCancelFullScreen"]()
        }
        _OnSetHash(a) {
            location.hash = a["hash"]
        }
        _OnHashChange() {
            this.PostToRuntime("hashchange", {
                "location": location.toString()
            })
        }
    };
    RuntimeInterface.AddDOMHandlerClass(a)
}