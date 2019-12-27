document.addEventListener('DOMContentLoaded', function () {
    checkStorage();
    var checkPageButton = document.getElementById('refresh');
    checkPageButton.addEventListener('click', function () {
        updateTime();
    });
    updateTime();
}, false);

function checkStorage() {
    chrome.storage.sync.get(['max_hours'], function (result) {
        if (result === undefined) {
            chrome.storage.sync.set({'max_hours': 45});
        } else {
            document.getElementById('default_hours').value = result.max_hours;
        }
    });
}

function updateTime() {
    chrome.tabs.getSelected(null, function (tab) {
        if (validateSite(tab.url)) {
            chrome.tabs.executeScript(null, {code: '(' + getAccumulated + ')();'}, calculateHours);
        }
    });
}

function validateSite(url) {
    return url === 'https://webtime2.paylocity.com/WebTime/Employee/Timesheet';
}

function calculateHours(accumulated) {
    let max_hours = document.getElementById('default_hours').value;
    chrome.storage.sync.set({'max_hours': max_hours});
    let today = new Date();
    let pending = (max_hours - accumulated);

    let pending_minutes = parseInt((pending % 1) * 60);
    let pending_hours = parseInt(pending);
    let total_minutes = (pending_minutes + parseInt(pending_hours * 60));
    today.setMinutes(today.getMinutes() + total_minutes);

    document.getElementById('default_hours').value = max_hours;
    document.getElementById('total_hrs_worked').innerHTML = parseFloat(accumulated).toFixed(2);
    document.getElementById('today_pending').innerHTML = pending_hours.toString().padStart(2, '0') + ':' + pending_minutes.toString().padStart(2, '0');
    document.getElementById('must_leave_office').innerHTML = today.toLocaleTimeString();
}

function getAccumulated() {
    let date = new Date();
    let worked = parseFloat(document.querySelectorAll('#GroupTotals td:first-child')[0].innerText.replace(/[^\d.-]/g, ''));
    let nodes = document.querySelectorAll('td.entry span');
    let workedToday_element = nodes[nodes.length - 2];
    let time = workedToday_element.innerText.trim().split(" ")[0].split(":");
    worked += (date.getHours() + date.getMinutes() / 60) - (parseFloat(time[0]) + parseFloat(time[1] / 60));
    return worked;
}