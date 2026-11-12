window.onAppReady = async function() {
    const views = [
        document.getElementById('view-1'),
        document.getElementById('view-2'),
        document.getElementById('view-3'),
        document.getElementById('view-4')
    ];

    const salesData = await fetchSalesData();
    const transactions = FactoryDB.getTransactions();
    
    views[0].innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            <div class="bg-gradient-to-r from-emerald-500 to-emerald-700 text-white p-4 rounded-lg shadow-lg cursor-pointer" onclick="FactoryNav.openDetail('Today\'s Sales', '<p>${formatINR(salesData.todaySales)}</p>')">
                <h2 class="text-xl">Today's Sales</h2>
                <p class="text-2xl">${formatINR(salesData.todaySales)}</p>
            </div>
            <div class="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-4 rounded-lg shadow-lg cursor-pointer" onclick="FactoryNav.openDetail('Pending Udhar', '<p>${formatINR(salesData.pendingUdhar)}</p>')">
                <h2 class="text-xl">Pending Udhar</h2>
                <p class="text-2xl">${formatINR(salesData.pendingUdhar)}</p>
            </div>
            <div class="bg-gradient-to-r from-amber-500 to-amber-700 text-white p-4 rounded-lg shadow-lg cursor-pointer" onclick="FactoryNav.openDetail('Total Bills', '<p>${formatINR(salesData.totalBills)}</p>')">
                <h2 class="text-xl">Total Bills</h2>
                <p class="text-2xl">${formatINR(salesData.totalBills)}</p>
            </div>
        </div>
        <canvas id="salesChart" class="bg-violet-100 rounded-lg shadow-lg"></canvas>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            <div class="bg-gradient-to-r from-emerald-500 to-emerald-700 text-white p-4 rounded-lg shadow-lg cursor-pointer" onclick="FactoryNav.openDetail('Quick Action 1', '<p>Details for Action 1</p>')">
                Quick Action 1
            </div>
            <div class="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-4 rounded-lg shadow-lg cursor-pointer" onclick="FactoryNav.openDetail('Quick Action 2', '<p>Details for Action 2</p>')">
                Quick Action 2
            </div>
        </div>
    `;
    
    const ctx = document.getElementById('salesChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: salesData.chartData,
        options: { responsive: true }
    });

    views[1].innerHTML = `
        <div class="p-4">
            <input type="text" id="itemName" placeholder="Item Name" class="border p-2 w-full mb-2" />
            <input type="number" id="quantity" placeholder="Quantity" class="border p-2 w-full mb-2" />
            <input type="number" id="price" placeholder="Price" class="border p-2 w-full mb-2" />
            <input type="number" id="discount" placeholder="Discount" class="border p-2 w-full mb-2" />
            <button class="bg-gradient-to-r from-amber-500 to-amber-700 text-white p-2 rounded-lg w-full" onclick="generateBill()">Generate Bill</button>
            <button class="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-2 rounded-lg w-full mt-2" onclick="openQRCodeScanner()">Scan Product QR</button>
            <button class="bg-gradient-to-r from-green-500 to-green-700 text-white p-2 rounded-lg w-full mt-2" onclick="sendBillWhatsApp()">Send Bill on WhatsApp</button>
        </div>
    `;

    views[2].innerHTML = `
        <div class="p-4">
            <input type="text" id="app-search-bar" placeholder="Search Customers" class="border p-2 w-full mb-2" oninput="onSearchInput(this.value)" />
            <div id="customerList" class="mt-2"></div>
            <button class="bg-gradient-to-r from-green-500 to-green-700 text-white p-2 rounded-lg w-full mt-2" onclick="openAddCustomerModal()">Add New Customer</button>
        </div>
    `;
    populateCustomerList(transactions);

    views[3].innerHTML = `
        <div class="p-4">
            <h2 class="text-xl">Shopkeeper: ${FactoryDB.getUser().name}</h2>
            <h3 class="text-lg">Mobile: ${FactoryDB.getUser().mobile}</h3>
            <h4 class="text-lg">Transaction History</h4>
            <div id="transactionHistory" class="mt-2"></div>
            <button class="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-2 rounded-lg w-full mt-2" onclick="downloadMonthlyReport()">Download Monthly PDF Report</button>
            <button class="bg-gradient-to-r from-red-500 to-red-700 text-white p-2 rounded-lg w-full mt-2" onclick="logout()">Log Out</button>
        </div>
    `;
    populateTransactionHistory(transactions);

    FactoryUI.refreshIcons();
};

if (FactoryDB.getUserSync()) window.onAppReady();

window.onTabChange = function(tabNum) {
    const views = ['view-1', 'view-2', 'view-3', 'view-4'];
    views.forEach((view, index) => {
        document.getElementById(view).style.display = index === tabNum ? 'block' : 'none';
    });
};

window.onSearchInput = function(query) {
    const customerList = document.getElementById('customerList');
    const filteredCustomers = FactoryDB.getTransactions().filter(customer => customer.name.toLowerCase().includes(query.toLowerCase()));
    customerList.innerHTML = filteredCustomers.map(customer => `
        <div class="p-2 border-b cursor-pointer" onclick="FactoryNav.openDetail('${customer.name}', '<p>Ledger for ${customer.name}</p>')">
            ${customer.name} - ${customer.udhar} / ${customer.jama}
        </div>
    `).join('');
};

window.onFloatingAction = function() {
    openAddCustomerModal();
};

function generateBill() {
    const itemName = document.getElementById('itemName').value;
    const quantity = parseFloat(document.getElementById('quantity').value) || 0;
    const price = parseFloat(document.getElementById('price').value) || 0;
    const discount = parseFloat(document.getElementById('discount').value) || 0;

    const totalAmount = (quantity * price) - discount;
    if (totalAmount < 0) return;

    FactoryDB.recordTx(itemName, 'sale', totalAmount, 0, 0, 0);
    FactoryUI.receipt();
    FactoryUI.toast('Bill generated successfully!');
}

function openQRCodeScanner() {
    // Implementation for QR Code scanning
}

function sendBillWhatsApp() {
    const itemName = document.getElementById('itemName').value;
    const quantity = parseFloat(document.getElementById('quantity').value) || 0;
    const price = parseFloat(document.getElementById('price').value) || 0;
    const discount = parseFloat(document.getElementById('discount').value) || 0;
    const totalAmount = (quantity * price) - discount;

    const message = `Bill for ${itemName}\nQuantity: ${quantity}\nPrice: ${formatINR(price)}\nDiscount: ${discount}\nTotal: ${formatINR(totalAmount)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
}

function populateCustomerList(transactions) {
    const customerList = document.getElementById('customerList');
    customerList.innerHTML = transactions.map(customer => `
        <div class="p-2 border-b cursor-pointer" onclick="FactoryNav.openDetail('${customer.name}', '<p>Ledger for ${customer.name}</p>')">
            ${customer.name} - ${customer.udhar} / ${customer.jama}
        </div>
    `).join('');
}

function populateTransactionHistory(transactions) {
    const transactionHistory = document.getElementById('transactionHistory');
    transactionHistory.innerHTML = transactions.map(tx => `
        <div class="p-2 border-b">
            ${tx.title} - ${formatINR(tx.amount)} on ${new Date(tx.date).toLocaleDateString()}
        </div>
    `).join('');
}

function downloadMonthlyReport() {
    FactoryUI.downloadPDF('Monthly_Report');
}

function logout() {
    // Implementation for logging out
}

function openAddCustomerModal() {
    // Implementation for opening modal to add new customer
}