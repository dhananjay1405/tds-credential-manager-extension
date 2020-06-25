"use strict";
let lstClients = [];
function escapeJS(unsafe) {
    return unsafe
        .replace(/'/g, "''");
}
function loadClients(cb) {
    chrome.storage.local.get((d) => {
        if (d && Array.isArray(d['credentials']))
            lstClients = d['credentials'];
        cb();
    });
}
function saveClients(cb) {
    lstClients = lstClients.sort((a, b) => a.name < b.name ? -1 : 1);
    chrome.storage.local.set({ credentials: lstClients }, () => cb());
}
function reloadClientDropdown() {
    $('#ddlClients').html('');
    $('#ddlClients').append('<option value="-1">(New Client)</option>');
    for (let i = 0; i < lstClients.length; i++)
        $('#ddlClients').append('<option value=' + i + '>' + lstClients[i].name + '</option>');
}
function exportToClipboard() {
    let result = 'name\tuser\tpass\tTAN\r\n';
    for (let i = 0; i < lstClients.length; i++)
        result += `${lstClients[i].name}\t${lstClients[i].user}\t${lstClients[i].pass}\t${lstClients[i].tan}\r\n`;
    result = result.substr(0, result.length - 2);
    $('#txtCopyData').val(result);
    $('#txtCopyData').select();
    document.execCommand('copy');
    $('#lblMessage').html('Data copied. Please paste in Excel');
}
function importFromClipboard(result) {
    lstClients = [];
    let lstRows = result.split(/\r\n/);
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
        $('#lblMessage').html('Client credentials imported. Please click the dropdown');
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
            $('#lblMessage').html('Name not found');
            return;
        }
        if (!clientUser) {
            $('#lblMessage').html('Invalid Username');
            return;
        }
        if (!clientPass) {
            $('#lblMessage').html('Invalid Password');
            return;
        }
        let idxClient = lstClients.findIndex(p => p.name == clientName);
        if (idxClient !== -1) {
            $('#lblMessage').html('Duplicate client name');
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
            $('#lblMessage').html('Client credentials added. Please click the dropdown');
        });
    });
    $('#btnDeleteClient').click(() => {
        let selectedIndex = parseInt($('#ddlClients').val());
        lstClients.splice(selectedIndex, 1);
        saveClients(() => {
            reloadClientDropdown();
            $('#ddlClients').val(-1);
            $('#ddlClients').trigger('change');
            $('#lblMessage').html('Client deleted');
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
            $('#lblMessage').html('Credentials updated');
        });
        reloadClientDropdown();
        $('#ddlClients').val(selectedIndex);
        $('#ddlClients').trigger('change');
        $('#lblMessage').html('Credentials updated');
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
    $('#btnPasteCredentials').click(() => {
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
            window.close();
            chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
                let extn = tabs[0];
                if (extn.url == 'https://www.tdscpc.gov.in/app/login.xhtml' && extn.id)
                    chrome.tabs.sendMessage(extn.id, msg);
            });
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
