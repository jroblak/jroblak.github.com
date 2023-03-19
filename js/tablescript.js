const airtableApiKey = 'patUblTA3oYVPVVV7.7fdb6dc19b94ad6f6f8b7c91fe4ab11616dfad7242cfe40a834e186a4356b022';
const airtableBaseId = 'appaK45tGSHaDJBnU';
const airtableTableName = 'Predictions';

class AirtableTable {
  constructor() {
    this.records = [];
  }

  async getData() {
    const url = `https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${airtableApiKey}` },
    });
    const data = await response.json();
    this.records = data.records;
  }

  generateTable() {
    const table = document.createElement('table');
    table.innerHTML = `
      <thead>
        <tr>
          <th>Date</th>
          <th>Predictor</th>
          <th>Prediction</th>
          <th>Prediction Date</th>
          <th>Result</th>
        </tr>
      </thead>
    `;
    const tbody = document.createElement('tbody');
    this.records.forEach((record, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${record.fields.Date}</td>
        <td>${record.fields.Predictor}</td>
        <td>${record.fields.Prediction}</td>
        <td>${record.fields.Prediction_Date}</td>
        <td>${record.fields.Result}</td>
      `;
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    table.setAttribute('class', 'sortable');
    return table;
  }

  async render() {
    await this.getData();
    const tableContainer = document.querySelector('#table-container');
    tableContainer.appendChild(this.generateTable());
    new Sortable(document.querySelector('.sortable'), {
      animation: 150,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      sort: true,
    });
  }
}

const airtableTable = new AirtableTable();
airtableTable.render();
