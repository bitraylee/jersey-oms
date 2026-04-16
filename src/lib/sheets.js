const SPREADSHEET_ID = import.meta.env.VITE_GOOGLE_SPREADSHEET_ID;
const BASE_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`;

const getHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
});

// Fetch all Data from a specific range (e.g., 'Products!A2:D' or 'Orders!A2:H')
export const fetchSheetDataRange = async (token, range) => {
  if (!token) throw new Error("No access token provided");

  const response = await fetch(`${BASE_URL}/values/${range}`, {
    method: 'GET',
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData?.error?.message || "Failed to fetch spreadsheet data");
  }

  const data = await response.json();
  return data.values || [];
};

export const fetchProducts = async (token) => {
  // Assuming Headers are in row 1: Name, Year, Type, Sizes
  const values = await fetchSheetDataRange(token, 'Products!A2:D');
  return values.map((row) => ({
    name: row[0] || '',
    year: row[1] || '',
    type: row[2] || '',
    sizes: row[3] ? row[3].split(',').map(s => s.trim()) : [],
  }));
};

export const fetchOrders = async (token) => {
  // Assuming Headers: Order ID, Timestamp, Customer Name, Contact Info, Products, Sizes, Quantities, Status
  const values = await fetchSheetDataRange(token, 'Orders!A2:H');
  return values.map((row, index) => ({
    id: row[0] || '',
    timestamp: row[1] || '',
    customerName: row[2] || '',
    contactInfo: row[3] || '',
    products: row[4] ? JSON.parse(row[4] || '[]') : [],
    sizes: row[5] ? JSON.parse(row[5] || '[]') : [],
    quantities: row[6] ? JSON.parse(row[6] || '[]') : [],
    status: row[7] || '',
    rowIndex: index + 2, // A2 is row 2
  }));
};

// Append a new row to Orders sheet
export const appendOrder = async (token, order) => {
  const range = 'Orders!A:H';
  const values = [
    [
      order.id,
      order.timestamp,
      order.customerName,
      order.contactInfo,
      JSON.stringify(order.products),   // Arrays encoded as JSON strings to fit in singular cells
      JSON.stringify(order.sizes),      
      JSON.stringify(order.quantities), 
      order.status,
    ]
  ];

  const response = await fetch(`${BASE_URL}/values/${range}:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ values }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData?.error?.message || "Failed to append order");
  }

  return response.json();
};

export const updateOrderStatus = async (token, rowIndex, newStatus) => {
  // Status column is H (8th column)
  const range = `Orders!H${rowIndex}`;
  const values = [
    [newStatus]
  ];

  const response = await fetch(`${BASE_URL}/values/${range}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify({ values }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData?.error?.message || "Failed to update order status");
  }

  return response.json();
};

export const appendProduct = async (token, product) => {
  const range = 'Products!A:D';
  const values = [
    [
      product.name,
      product.year,
      product.type,
      product.sizes.join(', ')
    ]
  ];

  const response = await fetch(`${BASE_URL}/values/${range}:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ values }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData?.error?.message || "Failed to append product");
  }

  return response.json();
};
