// ==UserScript==
// @name         Late Orders Monitor (Dark Vercel Style, Production Ready)
// @namespace    https://weeorder.co.uk/
// @version      5.0
// @description  Monitor orders with dark mode Vercel styling, highlight new orders, notify with sound and cache details.
// @author       You
// @match        https://unprintorders.weeorder.co.uk/PreOrders/LateOrders
// @grant        GM_addStyle
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

        // Normalize the id: trim and remove excess whitespace/newlines etc
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
        // Normalize all ids before saving
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

    // Utility: logs diffs for debugging
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

    // Request notification permission
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

        // Log diffs to debug why reload triggers notifications
        logDiffs(previousOrderIds, currentOrderIds);

        if (isFirstCheck) {
            // Save current state and set initialized flag - no notifications
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

    // Insert Vercel-like dark mode styles (full coverage for site)
    GM_addStyle(`
        /* Base dark background and text */
        body {
            background-color: #0f0f0f !important;
            color: #eaeaea !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
                         Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif !important;
            margin: 0;
            padding: 0 20px 40px 20px;
            line-height: 1.5;
            font-size: 15px;
        }
        /* Header bar */
        #header, .header, header {
            background-color: #111111 !important;
            color: #eaeaea !important;
            font-weight: 600 !important;
            font-size: 17px !important;
            padding: 14px 20px !important;
            border-bottom: 1px solid #222 !important;
        }
        /* Buttons */
        button, input[type="button"], input[type="submit"], .btn {
            background-color: #ff5a1f !important;
            color: white !important;
            border: none !important;
            border-radius: 6px !important;
            padding: 10px 16px !important;
            cursor: pointer !important;
            font-weight: 600 !important;
            font-size: 14px !important;
            transition: background-color 0.3s ease !important;
        }
        button:hover, input[type="button"]:hover, input[type="submit"]:hover, .btn:hover {
            background-color: #e94e17 !important;
        }
        /* Shop containers */
        .shop {
            background-color: #1a1a1a !important;
            border: 1px solid #333 !important;
            border-radius: 6px !important;
            margin: 18px auto !important;
            padding: 14px 18px !important;
            max-width: 720px !important;
            box-shadow: 0 4px 6px rgba(0,0,0,0.6) !important;
        }
        /* Orders container */
        #result {
            max-width: 720px !important;
            margin: 20px auto !important;
        }
        /* Orders details box */
        .orders > div {
            background-color: #1a1a1a !important;
            border: 1px solid #333 !important;
            border-radius: 6px !important;
            padding: 14px 18px !important;
            margin: 12px 0 !important;
            font-size: 14px !important;
            color: #ccc !important;
            font-weight: 400 !important;
            line-height: 1.4 !important;
            transition: background-color 0.2s ease !important;
        }
        .orders > div:hover {
            background-color: #222 !important;
        }
        /* "view order" link styling */
        .orders a {
            color: #ff5a1f !important;
            font-weight: 600 !important;
            text-decoration: none !important;
        }
        .orders a:hover {
            text-decoration: underline !important;
        }
        /* Highlight new orders */
        .highlight-new {
            background-color: #2a4d14 !important;
            transition: background-color 1.5s ease !important;
        }
        /* Text bold for shop header */
        .orders > div:first-child {
            font-weight: 700 !important;
            margin-bottom: 8px !important;
            color: #ddd !important;
        }
        /* Footer date text */
        #footer, footer {
            color: #666 !important;
            font-size: 13px !important;
            margin-top: 40px !important;
            border-top: 1px solid #222 !important;
            padding-top: 12px !important;
            max-width: 720px !important;
            margin-left: auto !important;
            margin-right: auto !important;
        }
    `);

    let previousOrderIds = loadStoredIds();
    let previousOrderDetails = loadStoredDetails();
    let isFirstCheck = !localStorage.getItem(STORAGE_KEY_INITIALIZED);

    function highlightNewOrders(idsToHighlight) {
        const allOrders = getOrderElements();
        allOrders.forEach(orderEl => {
            const id = orderEl.querySelector('div:nth-child(1) span')?.textContent.trim();
            if (id && idsToHighlight.includes(id)) {
                const shopDiv = orderEl.closest('.shop');
                if (shopDiv) {
                    shopDiv.classList.add('highlight-new');
                    setTimeout(() => {
                        shopDiv.classList.remove('highlight-new');
                    }, 2000);
                }
            }
        });
    }

    function checkOrders() {
        const orderEls = getOrderElements();

        const currentOrderDetails = {};
        const currentOrderIds = [];

        orderEls.forEach(orderEl => {
            const { id, shop, customer, delivery } = extractOrderDetails(orderEl);
            currentOrderIds.push(id);
            currentOrderDetails[id] = { shop, customer, delivery };
        });

        // Log diffs to debug why reload triggers notifications
        logDiffs(previousOrderIds, currentOrderIds);

        if (isFirstCheck) {
            // Save current state and set initialized flag - no notifications
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

    // Run first check after a short delay to ensure DOM is fully loaded
    setTimeout(() => {
        checkOrders();
        // Start interval checks
        setInterval(checkOrders, CHECK_INTERVAL_MS);
    }, 3000);

    // Auto refresh every 20 seconds
    setTimeout(() => {
        window.location.reload();
    }, REFRESH_INTERVAL_MS);

})();
