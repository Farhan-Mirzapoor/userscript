// ==UserScript==
// @name         Late Orders Monitor with Export to Excel and Notifications
// @namespace    https://weeorder.co.uk/
// @version      6.1
// @description  Monitor orders, notify with icons when new orders are added or printed, removes highlighting, and adds an Excel export button.
// @author       You
// @match        https://unprintorders.weeorder.co.uk/PreOrders/LateOrders
// @grant        GM_addStyle
// @require      https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.1/xlsx.full.min.js
// ==/UserScript==

(function () {
  "use strict";

  const CHECK_INTERVAL_MS = 1000; // Check for new orders every 1 second
  const REFRESH_INTERVAL_MS = 20000; // Refresh every 20 seconds

  // Load the saved order IDs from localStorage, or initialize if not available
  let lastOrderIds = JSON.parse(localStorage.getItem("lastOrderIds")) || [];

  // Save the updated order IDs to localStorage
  function saveOrderIds() {
    localStorage.setItem("lastOrderIds", JSON.stringify(lastOrderIds));
  }

  // Inject custom style for Excel export button
  GM_addStyle(`
    #exportBtn {
        padding: 10px;
        font-size: 14px;
        background-color: #4CAF50;
        color: white;
        border: none;
        cursor: pointer;
        margin: 10px;
    }
    #exportBtn:hover {
        background-color: #45a049;
    }
  `);

  // Function to insert the export button
  function insertExportButton() {
    const navbarContainer = document.querySelector(
      "body > div.navbar.navbar-inverse.navbar-fixed-top > div > div.navbar-collapse.collapse"
    );

    if (navbarContainer) {
      const exportBtnHTML = `
        <button id="exportBtn">Export to Excel</button>
      `;
      navbarContainer.insertAdjacentHTML("beforeend", exportBtnHTML); // Insert button in navbar
      console.log("Export button inserted successfully");

      document.querySelector("#exportBtn").addEventListener("click", exportTableToExcel); // Add click handler
    } else {
      console.error("Failed to find navbar container for export button");
    }
  }

  // Function to extract order data
  function getOrderData() {
    const orders = document.querySelectorAll(".shop");
    const orderData = [];

    orders.forEach((shop) => {
      const shopTitle = shop.querySelector(".shopTitle")?.textContent.trim();
      const shopId = shopTitle ? shopTitle.split("-").pop().trim() : "";
      const orderId = shop.querySelector(".orders > div > span")?.textContent.trim().replace("Order ID : ", "");
      const customer = shop.querySelector(".orders > div:nth-child(2) > span")?.textContent.trim().split(">>>")[0].trim();
      const time = shop.querySelector(".orders > div:nth-child(3) > span")?.textContent.trim();
      const total = shop.querySelector(".orders > div:nth-child(5) > span")?.textContent.trim();
      const paymentMethod = shop.querySelector(".orders > div:nth-child(6) > span")?.textContent.trim();
      const ps = shop.querySelector(".orders > div:nth-child(7) > span")?.textContent.trim();

      if (paymentMethod === "Moneos" && orderId && customer) {
        orderData.push({
          shopId,
          shopName: shopTitle,
          orderId,
          customer,
          time,
          total,
          paymentMethod,
          ps,
        });
      }
    });

    console.log(`Found ${orderData.length} Moneos orders`);
    return orderData;
  }

  // Function to format total with pound sign (£)
  function formatTotalWithPound(total) {
    return `£${parseFloat(total).toFixed(2)}`;
  }

  // Function to export the orders to an Excel file
  function exportTableToExcel() {
    const orderData = getOrderData();
    if (orderData.length === 0) {
      alert("No Moneos orders found to export.");
      return;
    }

    const ws = XLSX.utils.aoa_to_sheet([
      [
        "Shop ID",
        "Shop Name",
        "Order ID",
        "Customer",
        "Time",
        "Amount",
        "Payment Method",
        "PS",
      ],
      ...orderData.map((order) => [
        order.shopId,
        order.shopName,
        order.orderId,
        order.customer,
        order.time,
        formatTotalWithPound(order.total),
        order.paymentMethod,
        order.ps,
      ]),
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, "Moneos_Orders.xlsx");
  }

  // Function to show a notification
  function showNotification(order) {
    if (lastOrderIds.includes(order.orderId)) return; // Avoid duplicate notifications
    lastOrderIds.push(order.orderId);
    saveOrderIds(); // Save updated order IDs to localStorage

    const notificationTitle = `${order.shopName}`;
    const notificationBody = `Customer: ${order.customer}\nDelivery Time: ${order.time}`;

    const notification = new Notification(notificationTitle, {
      body: notificationBody,
      icon: "https://unprintorders.weeorder.co.uk/favicon.ico", // Your site's favicon
    });
  }

  // Function to check for new orders
  function checkForNewOrders() {
    const orders = getOrderData();
    orders.forEach((order) => showNotification(order));
  }

  // Page auto-refresh every 20 seconds
  setInterval(() => {
    location.reload(); // Refresh page
  }, REFRESH_INTERVAL_MS);

  // Start monitoring after page load
  window.onload = function () {
    if (Notification.permission !== "granted") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          console.log("Notification permission granted.");
        } else {
          console.warn("Notification permission denied.");
        }
      });
    }

    insertExportButton(); // Insert export button
    console.log("Page loaded, starting order monitoring...");
    checkForNewOrders(); // Initial check for orders
    setInterval(checkForNewOrders, CHECK_INTERVAL_MS); // Check for new orders every 1 second
  };
})();
