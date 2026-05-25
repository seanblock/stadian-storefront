export class PaymentForm {
    config;
    containerIds;
    _destroyed = false;
    constructor(config, containerIds) {
        this.config = config;
        this.containerIds = containerIds;
    }
    static async mount(config, containerIds) {
        if (!config.gateway_enabled || !config.js_library_url) {
            throw new Error("Payment gateway is not enabled");
        }
        await loadScript(config.js_library_url);
        const form = new PaymentForm(config, containerIds);
        await form._init();
        return form;
    }
    async _init() {
        if (this.config.gateway_type === "nmi") {
            await this._initCollectJs();
        }
        // Accept.js needs no additional init — reads form fields on tokenize
    }
    async _initCollectJs() {
        const win = window;
        const CollectJS = win.CollectJS;
        if (CollectJS?.configure) {
            CollectJS.configure({
                tokenizationKey: this.config.public_key,
                variant: "inline",
                fields: {
                    ...(this.containerIds.cardNumber ? { ccnumber: { selector: `#${this.containerIds.cardNumber}` } } : {}),
                    ...(this.containerIds.cardExpiry ? { ccexp: { selector: `#${this.containerIds.cardExpiry}` } } : {}),
                    ...(this.containerIds.cardCvv ? { cvv: { selector: `#${this.containerIds.cardCvv}` } } : {}),
                    ...(this.containerIds.accountNumber ? { checkaccount: { selector: `#${this.containerIds.accountNumber}` } } : {}),
                    ...(this.containerIds.routingNumber ? { checkaba: { selector: `#${this.containerIds.routingNumber}` } } : {}),
                },
            });
        }
    }
    async tokenize() {
        if (this._destroyed)
            throw new Error("PaymentForm has been destroyed");
        if (this.config.gateway_type === "nmi")
            return this._tokenizeNmi();
        if (this.config.gateway_type === "authorizenet")
            return this._tokenizeAuthNet();
        throw new Error(`Unsupported gateway: ${this.config.gateway_type}`);
    }
    _tokenizeNmi() {
        return new Promise((resolve, reject) => {
            const win = window;
            const CollectJS = win.CollectJS;
            if (!CollectJS) {
                reject(new Error("Collect.js not loaded"));
                return;
            }
            CollectJS.startPaymentRequest({
                callback: (response) => {
                    if (response.token) {
                        resolve({ token: response.token, payment_type: response.check ? "ach" : "card" });
                    }
                    else {
                        reject(new Error("Tokenization failed"));
                    }
                },
            });
        });
    }
    _tokenizeAuthNet() {
        return new Promise((resolve, reject) => {
            const win = window;
            const Accept = win.Accept;
            if (!Accept) {
                reject(new Error("Accept.js not loaded"));
                return;
            }
            const authData = {
                clientKey: this.config.form_config.client_key,
                apiLoginID: this.config.form_config.api_login_id,
            };
            const getVal = (id) => id ? document.getElementById(id)?.value || "" : "";
            const expiry = getVal(this.containerIds.cardExpiry);
            const cardData = {
                cardNumber: getVal(this.containerIds.cardNumber).replace(/\s/g, ""),
                month: expiry.split("/")[0]?.trim(),
                year: expiry.split("/")[1]?.trim(),
                cardCode: getVal(this.containerIds.cardCvv),
            };
            Accept.dispatchData({ authData, cardData }, (response) => {
                if (response.opaqueData) {
                    const opaque = response.opaqueData;
                    resolve({ token: opaque.dataValue, payment_type: "card" });
                }
                else {
                    const msgs = response.messages;
                    const msgList = msgs?.message;
                    reject(new Error(msgList?.[0]?.text || "Tokenization failed"));
                }
            });
        });
    }
    destroy() { this._destroyed = true; }
}
function loadScript(url) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${url}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement("script");
        script.src = url;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
        document.head.appendChild(script);
    });
}
