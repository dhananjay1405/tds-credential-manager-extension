/// <reference path="../../node_modules/@types/chrome/index.d.ts"/>

interface clientInfo {
    name: string;
    user: string;
    pass: string;
    tan: string;
}

interface messageInfo {
    action: string;
    param: any;
}

chrome.runtime.onMessage.addListener((msg: messageInfo) => {
    if (msg.action == 'paste-credential') {
        let objCredential: clientInfo = msg.param;
        if (location.href == 'https://www.tdscpc.gov.in/app/login.xhtml') {
            let eUser: HTMLInputElement = <HTMLInputElement>document.getElementById('userId');
            let ePass: HTMLInputElement = <HTMLInputElement>document.getElementById('psw');
            let eTAN: HTMLInputElement = <HTMLInputElement>document.getElementById('tanpan');
            eUser.value = objCredential.user;
            ePass.value = objCredential.pass;
            eTAN.value = objCredential.tan;
            eUser.dispatchEvent(new Event('change'));
            ePass.dispatchEvent(new Event('change'));
            eTAN.dispatchEvent(new Event('change'));
            setTimeout(() => {
                let eCaptcha: HTMLInputElement = <HTMLInputElement>document.getElementById('captcha');
                eCaptcha.focus();
                eCaptcha.select();
            }, 500);
        }
    }
});