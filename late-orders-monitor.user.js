// ==UserScript==
// @name         Late Orders Monitor (Vercel Dark Mode)
// @namespace    https://weeorder.co.uk/
// @version      3.6
// @description  Monitor orders with notifications and clean Vercel-style dark UI for LateOrders page.
// @author       You
// @match        https://unprintorders.weeorder.co.uk/PreOrders/LateOrders
// @grant        GM_addStyle
// @updateURL    https://cdn.jsdelivr.net/gh/Farhan-Mirzapoor/userscript@main/late-orders-monitor.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/Farhan-Mirzapoor/userscript@main/late-orders-monitor.user.js
// ==/UserScript==

(function () {
    'use strict';

    // Constants
    const CHECK_INTERVAL_MS = 1000;
    const REFRESH_INTERVAL_MS = 20000;
    const NOTIFICATION_ICON = 'https://unprintorders.weeorder.co.uk/favicon.ico';
    const SOUND_URL = 'https://notificationsounds.com/storage/sounds/file-sounds-1144-cash-register.mp3';
    const STORAGE_KEY_IDS = 'late_orders_monitor_ids';
    const STORAGE_KEY_DETAILS = 'late_orders_monitor_details';
    const STORAGE_KEY_INITIALIZED = 'late_orders_monitor_initialized';

    // Load Inter font from Google Fonts
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    // Vercel-inspired Dark Mode Styles
    GM_addStyle(`
        /* Reset and base */
        body, html {
            margin: 0;
            padding: 0;
            background-color: #0a0a0a !important;
            color: #e7e7e7 !important;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
                Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif !important;
            -webkit-font-smoothing: antialiased !important;
            -moz-osx-font-smoothing: grayscale !important;
            font-size: 16px;
            line-height: 1.5;
        }

        #result {
            max-width: 900px;
            margin: 2rem auto;
            padding: 0 1rem 3rem;
        }

        .shop {
            background: #121212;
            border-radius: 12px;
            margin-bottom: 1.5rem;
            padding: 1.25rem 1.5rem;
            box-shadow:
                0 2px 4px rgba(0, 0, 0, 0.8),
                0 0 1px 1px #222;
            border: 1px solid #222;
            transition: background-color 0.3s ease;
        }

        .shop:hover {
            background-color: #1e1e1e;
        }

        .shop > div:first-child {
            font-weight: 600;
            font-size: 1.125rem;
            margin-bottom: 0.5rem;
            color: #fff;
            letter-spacing: 0.03em;
            text-transform: uppercase;
            user-select: none;
        }

        .orders {
            background-color: #181818;
            margin-top: 0.75rem;
            padding: 1rem 1.25rem;
            border-radius: 8px;
            box-shadow: inset 0 0 4px rgba(255, 255, 255, 0.05);
            font-weight: 400;
            font-size: 0.95rem;
            display: grid;
            grid-template-columns: 1fr 3fr 3fr;
            gap: 1rem;
            color: #bbb;
        }

        .orders > div:nth-child(1) {
            font-weight: 600;
            color: #7fdbca; /* teal-ish */
        }

        .orders > div:nth-child(1) span {
            font-weight: 700;
            color: #50e3c2;
            user-select: text;
        }

        .orders > div:nth-child(2), .orders > div:nth-child(3) {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            user-select: text;
        }

        .highlighted {
            background-color: #238636 !important;
            box-shadow: 0 0 15px #238636aa;
            transition: background-color 1s ease;
        }

        /* Scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
        }

        ::-webkit-scrollbar-track {
            background: #0a0a0a;
        }

        ::-webkit-scrollbar-thumb {
            background-color: #222;
            border-radius: 4px;
        }

        /* Notifications permissions message */
        #notification-permission-warning {
            position: fixed;
            bottom: 12px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #ff6f61;
            color: white;
            padding: 8px 14px;
            border-radius: 8px;
            font-weight: 600;
            font-family: 'Inter', sans-serif;
            box-shadow: 0 2px 6px rgba(0,0,0,0.7);
            user-select: none;
            z-index: 9999;
        }
    `);

    // Notification permission reminder if needed
    function showNotificationPermissionWarning() {
        if (Notification.permission === 'default') {
            const warn = document.createElement('div');
            warn.id = 'notification-permission-warning';
            warn.textContent = 'Please allow notifications to get order alerts';
            document.body.appendChild(warn);
            setTimeout(() => warn.remove(), 8000);
        }
    }

    // Notification sound setup
    const notificationSound = new Audio(SOUND_URL);
    notificationSound.volume = 0.8;

    function playSound() {
        notificationSound.pause();
        notificationSound.currentTime = 0;
        notificationSound.play().catch(() => {
            // Play blocked until user interacts with page
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
        return { id: idRaw.trim(), shop, customer, delivery };
    }

    function highlightNewOrders(idsToHighlight) {
        getOrderElements().forEach(orderEl => {
            const id = orderEl.querySelector('div:nth-child(1) span')?.textContent.trim();
            if (id && idsToHighlight.includes(id)) {
                const shopDiv = orderEl.closest('.shop');
                if (shopDiv) {
                    shopDiv.classList.add("highlighted");
                    setTimeout(() => shopDiv.classList.remove("highlighted"), 2500);
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
        localStorage.setItem(STORAGE_KEY_IDS, JSON.stringify(ids.map(id => id.trim())));
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
        console.log("Added IDs:", added);
        console.log("Removed IDs:", removed);
        console.groupEnd();
    }

    // Request notification permission once
    if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission !== 'granted') showNotificationPermissionWarning();
        });
    } else if (Notification.permission !== 'granted') {
        showNotificationPermissionWarning();
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

    // Initial check after DOM ready
    setTimeout(() => {
        checkOrders();
        setInterval(checkOrders, CHECK_INTERVAL_MS);
    }, 3000);

    // Auto-refresh every 20 seconds
    setTimeout(() => {
        window.location.reload();
    }, REFRESH_INTERVAL_MS);

})();
