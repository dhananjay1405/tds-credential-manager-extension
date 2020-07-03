"use strict";
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action == 'paste-credential') {
        let objCredential = msg.param;
        if (location.href == 'https://www.tdscpc.gov.in/app/login.xhtml') {
            let eUser = document.getElementById('userId');
            let ePass = document.getElementById('psw');
            let eTAN = document.getElementById('tanpan');
            eUser.value = objCredential.user;
            ePass.value = objCredential.pass;
            eTAN.value = objCredential.tan;
            eUser.dispatchEvent(new Event('change'));
            ePass.dispatchEvent(new Event('change'));
            eTAN.dispatchEvent(new Event('change'));
            setTimeout(() => {
                let eCaptcha = document.getElementById('captcha');
                eCaptcha.focus();
                eCaptcha.select();
            }, 500);
        }
    }
});
