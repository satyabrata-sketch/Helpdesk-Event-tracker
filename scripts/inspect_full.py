import openpyxl

wb = openpyxl.load_workbook('Yearly Event Tracker- DT-3 and DT-4 Updated.xlsx', read_only=True, data_only=True)
sheets_2025 = ['Jan25', 'Feb25', 'Mar25', 'Apr25', 'May25', 'Jun25', 'Jul25', "Aug'25 (2)", "Sep'25- Downtown-3", "Downtown-4 Sep'25", "Oct'25", "Nov'25", "Dec25"]
total_2025 = 0
for s in sheets_2025:
    ws = wb[s]
    rows = list(ws.iter_rows(values_only=True))
    header = rows[1] if len(rows) > 1 else None
    data = [r for r in rows[2:] if r and any(c is not None and str(c).strip() != '' for c in r)]
    print(f'{s}: {len(data)} data rows; headers: {header[:6]}')
    total_2025 += len(data)
print('Total 2025 events in monthly sheets:', total_2025)
wb.close()
