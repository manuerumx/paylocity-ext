document.addEventListener('DOMContentLoaded', function () {
    let checkPageButton = document.getElementById('refresh');
    checkPageButton.addEventListener('click', function () {
        updateTime();
    });
    updateTime();
}, false);



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
    let max_hours = 45;
    let today = new Date();
    let advanced_hours = 0;
    let pending;

    if ((4 - today.getDay()) > 0) {
        let total_hours_by_now = today.getDay() * 9;
        pending = total_hours_by_now - accumulated;
        advanced_hours = pending < 0 ? pending * -1 : 0;
    } else {
        pending = (max_hours - accumulated);
    }

    let pending_minutes = parseInt((pending % 1) * 60);
    let pending_hours = parseInt(pending);
    let total_minutes = (pending_minutes + parseInt(pending_hours * 60));
    today.setMinutes(today.getMinutes() + total_minutes);

    let hours_accumulated = parseInt(accumulated);
    let minutes_accumulated = parseInt((accumulated % 1) * 60);

    document.getElementById('advanced_hrs_worked').innerHTML = formatTimeToString(advanced_hours, minutes_accumulated);
    document.getElementById('total_hrs_worked').innerHTML = formatTimeToString(hours_accumulated, minutes_accumulated);
    document.getElementById('today_pending').innerHTML = formatTimeToString(pending_hours, pending_minutes);
    document.getElementById('must_leave_office').innerHTML = today.toLocaleString();
}

/**
 * Convert hours and minutes to a string.
 * @param hours
 * @param minutes
 * @returns {string}
 */
function formatTimeToString(hours, minutes) {
    return hours.toString().padStart(2, '0') + ':' + minutes.toString().padStart(2, '0')
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