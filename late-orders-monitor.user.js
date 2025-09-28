// ==UserScript==
// @name         Late Orders Monitor (Debugged & Production Ready)
// @namespace    https://weeorder.co.uk/
// @version      3.4
// @description  Monitor orders, highlight new ones, notify with sound and cache details. Includes debug logging for reload notifications issue.
// @author       You
// @match        https://unprintorders.weeorder.co.uk/PreOrders/LateOrders
// @grant        GM_addStyle
// @updateURL    https://cdn.jsdelivr.net/gh/Farhan‑Mirzapoor/userscript@main/late-orders-monitor.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/Farhan‑Mirzapoor/userscript@main/late-orders-monitor.user.js
// ==/UserScript==

(function () {
    'use strict';

    const CHECK_INTERVAL_MS = 1000;
    const REFRESH_INTERVAL_MS = 20000;
    const NOTIFICATION_ICON = 'https://unprintorders.weeorder.co.uk/favicon.ico';
    const SOUND_URL = 'https://notificationsounds.com/storage/sounds/file-sounds-1144-cash-register.mp3';
    const STORAGE_KEY_IDS = 'late_orders_monitor_ids';
    const STORAGE_KEY_DETAILS = 'late_orders_monitor_details';
    const STORAGE_KEY_INITIALIZED = 'late_orders_monitor_initialized';

    const notificationSound = new Audio(SOUND_URL);
    notificationSound.volume = 0.8;

    function playSound() {
        notificationSound.pause();
        notificationSound.currentTime = 0;
        notificationSound.play().catch(() => {
            console.warn("Audio playback blocked. Interact with the page to enable sound.");
        });
    }

    function sendNotification(title, message) {
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: NOTIFICATION_ICON,
            });
            playSound();
        }
    }

    function getOrderElements() {
        return Array.from(document.querySelectorAll('#result .orders'));
    }

    function extractOrderDetails(orderEl) {
        const shopEl = orderEl.closest('.shop');
        const shop = shopEl ? shopEl.querySelector('div:first-child')?.textContent.trim() : 'Unknown Shop';

        const customer = orderEl.querySelector('div:nth-child(2)')?.textContent.trim() || 'Unknown Customer';
        const delivery = orderEl.querySelector('div:nth-child(3)')?.textContent.trim() || 'Unknown Delivery';
        const idRaw = orderEl.querySelector('div:nth-child(1) span')?.textContent || 'Unknown ID';

        const id = idRaw.trim();
        return { id, shop, customer, delivery };
    }

    function highlightNewOrders(idsToHighlight) {
        const allOrders = getOrderElements();
        allOrders.forEach(orderEl => {
            const id = orderEl.querySelector('div:nth-child(1) span')?.textContent.trim();
            if (id && idsToHighlight.includes(id)) {
                const shopDiv = orderEl.closest('.shop');
                if (shopDiv) {
                    shopDiv.style.transition = 'background-color 0.5s ease';
                    shopDiv.style.backgroundColor = 'lightgreen';
                    setTimeout(() => {
                        shopDiv.style.backgroundColor = '';
                    }, 2000);
                }
            }
        });
    }

    function loadStoredIds() {
        try {
            const data = localStorage.getItem(STORAGE_KEY_IDS);
            return data ? JSON.parse(data).map(id => id.trim()) : [];
        } catch {
            return [];
        }
    }

    function saveStoredIds(ids) {
        const normalized = ids.map(id => id.trim());
        localStorage.setItem(STORAGE_KEY_IDS, JSON.stringify(normalized));
    }

    function loadStoredDetails() {
        try {
            const data = localStorage.getItem(STORAGE_KEY_DETAILS);
            return data ? JSON.parse(data) : {};
        } catch {
            return {};
        }
    }

    function saveStoredDetails(details) {
        localStorage.setItem(STORAGE_KEY_DETAILS, JSON.stringify(details));
    }

    function logDiffs(prev, curr) {
        const added = curr.filter(id => !prev.includes(id));
        const removed = prev.filter(id => !curr.includes(id));
        console.group("Late Orders Monitor - Differences");
        console.log("Previous IDs:", prev);
        console.log("Current IDs:", curr);
        console.log("Added IDs:", added);
        console.log("Removed IDs:", removed);
        console.groupEnd();
    }

    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }

    let previousOrderIds = loadStoredIds();
    let previousOrderDetails = loadStoredDetails();
    let isFirstCheck = !localStorage.getItem(STORAGE_KEY_INITIALIZED);

    function checkOrders() {
        const orderEls = getOrderElements();
        const currentOrderDetails = {};
        const currentOrderIds = [];

        orderEls.forEach(orderEl => {
            const { id, shop, customer, delivery } = extractOrderDetails(orderEl);
            currentOrderIds.push(id);
            currentOrderDetails[id] = { shop, customer, delivery };
        });

        logDiffs(previousOrderIds, currentOrderIds);

        if (isFirstCheck) {
            localStorage.setItem(STORAGE_KEY_INITIALIZED, 'true');
            previousOrderIds = currentOrderIds;
            previousOrderDetails = currentOrderDetails;
            saveStoredIds(previousOrderIds);
            saveStoredDetails(previousOrderDetails);
            console.log("Initial load: saved current orders, skipping notifications.");
            isFirstCheck = false;
            return;
        }

        const addedOrders = currentOrderIds.filter(id => !previousOrderIds.includes(id));
        const removedOrders = previousOrderIds.filter(id => !currentOrderIds.includes(id));

        if (addedOrders.length > 0) {
            addedOrders.forEach(id => {
                const { shop, customer, delivery } = currentOrderDetails[id] || {};
                sendNotification(`New Unprint: ${shop}`, `Customer: ${customer}\nDelivery: ${delivery}\nOrder ID: ${id}`);
            });
            highlightNewOrders(addedOrders);
        }

        if (removedOrders.length > 0) {
            removedOrders.forEach(id => {
                const details = previousOrderDetails[id] || {};
                const shop = details.shop || 'Unknown Shop';
                const customer = details.customer || 'Unknown Customer';
                const delivery = details.delivery || 'Unknown Delivery';
                sendNotification(`Order Printed: ${shop}`, `Customer: ${customer}\nDelivery: ${delivery}\nOrder ID: ${id}`);
            });
        }

        previousOrderIds = currentOrderIds;
        previousOrderDetails = currentOrderDetails;
        saveStoredIds(previousOrderIds);
        saveStoredDetails(previousOrderDetails);
    }

    setTimeout(() => {
        checkOrders();
        setInterval(checkOrders, CHECK_INTERVAL_MS);
    }, 3000);

    setTimeout(() => {
        window.location.reload();
    }, REFRESH_INTERVAL_MS);

})();
