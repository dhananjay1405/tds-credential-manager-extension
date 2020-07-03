"use strict";
let lstClients = [];
function escapeHTML(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
async function loadClients(cb) {
    let d = await browser.storage.local.get();
    if (d && Array.isArray(d['credentials']))
        lstClients = d['credentials'];
    cb();
}
async function saveClients(cb) {
    lstClients = lstClients.sort((a, b) => a.name < b.name ? -1 : 1);
    await browser.storage.local.set({ credentials: lstClients });
    cb();
}
function reloadClientDropdown() {
    $('#ddlClients').children().remove();
    let elSelect = document.getElementById('ddlClients');
    let elOptDefault = document.createElement('option');
    elOptDefault.innerText = '(New Client)';
    elOptDefault.setAttribute('value', '-1');
    if (elSelect)
        elSelect.appendChild(elOptDefault);
    for (let i = 0; i < lstClients.length; i++) {
        let elOptItem = document.createElement('option');
        elOptItem.innerText = escapeHTML(lstClients[i].name);
        elOptItem.setAttribute('value', i.toString());
        if (elSelect)
            elSelect.appendChild(elOptItem);
    }
}
function exportToClipboard() {
    let result = 'name\tuser\tpass\tTAN\r\n';
    for (let i = 0; i < lstClients.length; i++)
        result += `${lstClients[i].name}\t${lstClients[i].user}\t${lstClients[i].pass}\t${lstClients[i].tan}\r\n`;
    result = result.substr(0, result.length - 2);
    $('#txtCopyData')[0].value = result;
    $('#txtCopyData').select();
    document.execCommand('copy');
    $('#lblMessage').text('Data copied. Please paste in Excel');
}
function importFromClipboard(result) {
    lstClients = [];
    let lstRows = result.split(/\r?\n/);
    for (let i = 0; i < lstRows.length; i++) {
        let row = lstRows[i];
        if (row.toLowerCase() == 'name\tuser\tpass\ttan')
            continue;
        let lstColumns = row.split(/\t/);
        if (lstColumns.length != 4)
            continue;
        let obj = {
            name: lstColumns[0],
            user: lstColumns[1],
            pass: lstColumns[2],
            tan: lstColumns[3],
        };
        lstClients.push(obj);
    }
    $('#txtPasteData').val('');
    saveClients(() => {
        reloadClientDropdown();
        $('#lblMessage').text('Client credentials imported. Please click the dropdown');
    });
}
$(document).ready(() => {
    loadClients(() => {
        reloadClientDropdown();
        $('#ddlClients').val(-1);
        $('#ddlClients').trigger('change');
    });
    $('#btnAddClient').click(() => {
        let clientName = $('#txtClientName').val();
        let clientUser = $('#txtClientUser').val();
        let clientPass = $('#txtClientPass').val();
        let clientTAN = $('#txtClientTAN').val();
        if (!clientName) {
            $('#lblMessage').text('Name not found');
            return;
        }
        if (!clientUser) {
            $('#lblMessage').text('Invalid Username');
            return;
        }
        if (!clientPass) {
            $('#lblMessage').text('Invalid Password');
            return;
        }
        let idxClient = lstClients.findIndex(p => p.name == clientName);
        if (idxClient !== -1) {
            $('#lblMessage').text('Duplicate client name');
            return;
        }
        lstClients.push({
            name: clientName,
            user: clientUser,
            pass: clientPass,
            tan: clientTAN
        });
        saveClients(() => {
            reloadClientDropdown();
            $('#lblMessage').text('Client credentials added. Please click the dropdown');
        });
    });
    $('#btnDeleteClient').click(() => {
        let selectedIndex = parseInt($('#ddlClients').val());
        lstClients.splice(selectedIndex, 1);
        saveClients(() => {
            reloadClientDropdown();
            $('#ddlClients').val(-1);
            $('#ddlClients').trigger('change');
            $('#lblMessage').text('Client deleted');
        });
    });
    $('#btnUpdateClient').click(() => {
        let selectedIndex = parseInt($('#ddlClients').val());
        let clientUser = $('#txtClientUser').val();
        let clientPass = $('#txtClientPass').val();
        let clientTAN = $('#txtClientTAN').val();
        lstClients[selectedIndex].user = clientUser;
        lstClients[selectedIndex].pass = clientPass;
        lstClients[selectedIndex].tan = clientTAN;
        saveClients(() => {
            reloadClientDropdown();
            $('#ddlClients').val(selectedIndex);
            $('#ddlClients').trigger('change');
            $('#lblMessage').text('Credentials updated');
        });
        reloadClientDropdown();
        $('#ddlClients').val(selectedIndex);
        $('#ddlClients').trigger('change');
        $('#lblMessage').text('Credentials updated');
    });
    $('#ddlClients').change(function () {
        let selectedIndex = parseInt($('#ddlClients').val());
        if (selectedIndex == -1) {
            $('#btnAddClient').prop('disabled', false);
            $('#btnUpdateClient').prop('disabled', true);
            $('#btnDeleteClient').prop('disabled', true);
            $('#txtClientName').prop('disabled', false);
            $('#txtClientName').val('');
            $('#txtClientUser').val('');
            $('#txtClientPass').val('');
            $('#txtClientTAN').val('');
        }
        else {
            $('#btnAddClient').prop('disabled', true);
            $('#btnUpdateClient').prop('disabled', false);
            $('#btnDeleteClient').prop('disabled', false);
            $('#txtClientName').prop('disabled', true);
            let itemClient = lstClients[selectedIndex];
            $('#txtClientName').val(itemClient.name);
            $('#txtClientUser').val(itemClient.user);
            $('#txtClientPass').val(itemClient.pass);
            $('#txtClientTAN').val(itemClient.tan);
        }
    });
    $('#btnPasteCredentials').click(async () => {
        let selectedIndex = parseInt($('#ddlClients').val());
        if (selectedIndex !== -1) {
            let user = lstClients[selectedIndex].user;
            let pass = lstClients[selectedIndex].pass;
            let tan = lstClients[selectedIndex].tan;
            let objCredential = {
                name: '',
                user,
                pass,
                tan
            };
            let msg = {
                action: 'paste-credential',
                param: objCredential
            };
            let tabs = await browser.tabs.query({ currentWindow: true, active: true });
            let extn = tabs[0];
            if (extn.url == 'https://www.tdscpc.gov.in/app/login.xhtml' && extn.id)
                await browser.tabs.sendMessage(extn.id, msg);
            window.close();
        }
    });
    $('#btnExport').click(() => exportToClipboard());
    $('#txtPasteData').on('paste', (e) => {
        e.preventDefault();
        let cpb = e.originalEvent;
        if (cpb.clipboardData) {
            let val = cpb.clipboardData.getData('text');
            importFromClipboard(val);
        }
    });
});
