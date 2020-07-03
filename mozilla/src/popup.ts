/// <reference path="../../node_modules/@types/firefox-webext-browser/index.d.ts"/>
/// <reference path="../../node_modules/@types/jquery/index.d.ts"/>

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

let lstClients: clientInfo[] = [];

function escapeHTML(unsafe: string): string {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function loadClients(cb: Function) {
    let d = await browser.storage.local.get();
    if (d && Array.isArray(d['credentials']))
        lstClients = d['credentials'];
    cb();
}

async function saveClients(cb: Function) {
    //sort the clients list
    lstClients = lstClients.sort((a, b) => a.name < b.name ? -1 : 1);

    //store it in localstorage
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
    //$('#ddlClients').append('<option value="-1">(New Client)</option>');
    for (let i = 0; i < lstClients.length; i++) {
        //$('#ddlClients').append('<option value=' + i + '>' + lstClients[i].name + '</option>');
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

    (<HTMLTextAreaElement>$('#txtCopyData')[0]).value = result;
    $('#txtCopyData').select();
    document.execCommand('copy');
    $('#lblMessage').text('Data copied. Please paste in Excel');
}

function importFromClipboard(result: string) {
    lstClients = [];
    let lstRows = result.split(/\r?\n/); //Firefox clipboard read text remove carriage return, so it is read optionally as line splitter
    for (let i = 0; i < lstRows.length; i++) {
        let row = lstRows[i];
        if (row.toLowerCase() == 'name\tuser\tpass\ttan') continue; //ignore column header
        let lstColumns = row.split(/\t/);
        if (lstColumns.length != 4) continue;
        let obj: clientInfo = {
            name: lstColumns[0],
            user: lstColumns[1],
            pass: lstColumns[2],
            tan: lstColumns[3],
        }
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
        let clientName = <string>$('#txtClientName').val();
        let clientUser = <string>$('#txtClientUser').val();
        let clientPass = <string>$('#txtClientPass').val();
        let clientTAN = <string>$('#txtClientTAN').val();
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

        //check if client name already exists
        let idxClient = lstClients.findIndex(p => p.name == clientName);
        if (idxClient !== -1) {
            $('#lblMessage').text('Duplicate client name');
            return;
        }

        //save client to disk
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
        let selectedIndex = parseInt(<string>$('#ddlClients').val());
        lstClients.splice(selectedIndex, 1);
        saveClients(() => {
            reloadClientDropdown();
            $('#ddlClients').val(-1);
            $('#ddlClients').trigger('change');
            $('#lblMessage').text('Client deleted');
        });
    });

    $('#btnUpdateClient').click(() => {
        let selectedIndex = parseInt(<string>$('#ddlClients').val());
        let clientUser = <string>$('#txtClientUser').val();
        let clientPass = <string>$('#txtClientPass').val();
        let clientTAN = <string>$('#txtClientTAN').val();
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
        let selectedIndex = parseInt(<string>$('#ddlClients').val());
        if (selectedIndex == -1) { //New
            $('#btnAddClient').prop('disabled', false); //enable Add button
            $('#btnUpdateClient').prop('disabled', true); //disable Update button
            $('#btnDeleteClient').prop('disabled', true); //disable Delete button
            $('#txtClientName').prop('disabled', false); //enable client name

            //clear the fields
            $('#txtClientName').val('');
            $('#txtClientUser').val('');
            $('#txtClientPass').val('');
            $('#txtClientTAN').val('');
        }
        else { //Existing
            $('#btnAddClient').prop('disabled', true); //disabled Add button
            $('#btnUpdateClient').prop('disabled', false); //enable Update button
            $('#btnDeleteClient').prop('disabled', false); //enable Delete button
            $('#txtClientName').prop('disabled', true); //disable client name

            //populate the fields
            let itemClient = lstClients[selectedIndex];
            $('#txtClientName').val(itemClient.name);
            $('#txtClientUser').val(itemClient.user);
            $('#txtClientPass').val(itemClient.pass);
            $('#txtClientTAN').val(itemClient.tan);
        }
    });

    $('#btnPasteCredentials').click(async () => {
        let selectedIndex = parseInt(<string>$('#ddlClients').val());
        if (selectedIndex !== -1) {
            let user = lstClients[selectedIndex].user;
            let pass = lstClients[selectedIndex].pass;
            let tan = lstClients[selectedIndex].tan;
            let objCredential: clientInfo = {
                name: '',
                user,
                pass,
                tan
            }
            let msg: messageInfo = {
                action: 'paste-credential',
                param: objCredential
            }

            let tabs = await browser.tabs.query({ currentWindow: true, active: true })
            let extn = tabs[0];
            if (extn.url == 'https://www.tdscpc.gov.in/app/login.xhtml' && extn.id)
                await browser.tabs.sendMessage(extn.id, msg);

            window.close();
        }
    });

    $('#btnExport').click(() => exportToClipboard());
    $('#txtPasteData').on('paste', (e) => {
        e.preventDefault();
        let cpb = <ClipboardEvent>e.originalEvent;
        if (cpb.clipboardData) {
            let val = cpb.clipboardData.getData('text');
            importFromClipboard(val);
        }
    });
});