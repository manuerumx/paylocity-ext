document.addEventListener('DOMContentLoaded', function () {
    let checkPageButton = document.getElementById('refresh');

    checkStorage();
    updateTime();

    checkPageButton.addEventListener('click', function () {
        updateTime();
    });
}, false);

/**
 * Check in the storage if a maximum number of hours are already defined.
 * If not, set the value to 45.
 */
function checkStorage() {
    chrome.storage.sync.get(['max_hours'], function (result) {
        let max_hours = 45;
        if (result.max_hours === undefined) {
            chrome.storage.sync.set({'max_hours': max_hours});
        } else {
            max_hours = result.max_hours;
        }
        document.getElementById('default_hours').value = max_hours;
    });
}

/**
 * Update the html with the current hours worked.
 */
function updateTime() {
    chrome.tabs.getSelected(null, function (tab) {
        if (validateSite(tab.url)) {
            chrome.tabs.executeScript(null, {code: '(' + getAccumulated + ')();'}, calculateHours);
        }
    });
}

/**
 * Validate if the current url is valid.
 *
 * @param url
 * @returns {boolean}
 */
function validateSite(url) {
    return url === 'https://webtime2.paylocity.com/WebTime/Employee/Timesheet';
}

/**
 * Calculate the amount of hours worked, pending and time to leave the office if you want to reach the goal in one session.
 *
 * @param accumulated
 */
function calculateHours(accumulated) {
    let max_hours = document.getElementById('default_hours').value;
    chrome.storage.sync.set({'max_hours': max_hours});
    let today = new Date();
    let pending = (max_hours - accumulated);

    let pending_minutes = parseInt((pending % 1) * 60);
    let pending_hours = parseInt(pending);
    let total_minutes = (pending_minutes + parseInt(pending_hours * 60));
    today.setMinutes(today.getMinutes() + total_minutes);

    let hours_accumulated = parseInt(accumulated);
    let minutes_accumulated = parseInt((accumulated % 1) * 60);

    document.getElementById('default_hours').value = max_hours;
    document.getElementById('total_hrs_worked').innerHTML = hours_accumulated.toString().padStart(2, '0') + ':' + minutes_accumulated.toString().padStart(2, '0');
    document.getElementById('today_pending').innerHTML = pending_hours.toString().padStart(2, '0') + ':' + pending_minutes.toString().padStart(2, '0');
    document.getElementById('must_leave_office').innerHTML = today.toLocaleString();
}

/**
 * Read the DOM and get the totals for the current period. Accumulate with the today hours worked.
 *
 * @returns {number}
 */
function getAccumulated() {
    let date = new Date();
    let worked = parseFloat(document.querySelectorAll('#GroupTotals td:first-child')[0].innerText.replace(/[^\d.-]/g, ''));
    let nodes = document.querySelectorAll('td.entry span');
    let workedToday_element = nodes[nodes.length - 2];
    let time = workedToday_element.innerText.trim().split(" ")[0].split(":");
    worked += (date.getHours() + date.getMinutes() / 60) - (parseFloat(time[0]) + parseFloat(time[1] / 60));
    return worked;
}