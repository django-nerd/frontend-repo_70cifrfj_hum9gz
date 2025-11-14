import { useEffect, useMemo, useState } from 'react'

function App() {
  const baseUrl = useMemo(() => import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000', [])

  // Cars
  const [cars, setCars] = useState([])
  const [carForm, setCarForm] = useState({ make: '', model: '', year: '', plate_number: '', daily_rate: '' })
  const [addingCar, setAddingCar] = useState(false)
  const [carError, setCarError] = useState('')

  // Rentals
  const [activeRentals, setActiveRentals] = useState([])
  const [rentingCarId, setRentingCarId] = useState(null)
  const [customerName, setCustomerName] = useState('')
  const [rentError, setRentError] = useState('')

  // Return & Invoice
  const [returningRentalId, setReturningRentalId] = useState(null)
  const [taxRate, setTaxRate] = useState('0.1')
  const [lastInvoice, setLastInvoice] = useState(null)

  // Invoices
  const [invoices, setInvoices] = useState([])

  const fetchCars = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/cars`)
      const data = await res.json()
      setCars(data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchActiveRentals = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/rentals/active`)
      const data = await res.json()
      setActiveRentals(data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchInvoices = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/invoices`)
      const data = await res.json()
      setInvoices(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchCars()
    fetchActiveRentals()
    fetchInvoices()
  }, [])

  const handleAddCar = async (e) => {
    e.preventDefault()
    setAddingCar(true)
    setCarError('')
    try {
      const payload = {
        make: carForm.make.trim(),
        model: carForm.model.trim(),
        year: Number(carForm.year),
        plate_number: carForm.plate_number.trim(),
        daily_rate: Number(carForm.daily_rate),
      }
      const res = await fetch(`${baseUrl}/api/cars`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Failed (${res.status})`)
      }
      setCarForm({ make: '', model: '', year: '', plate_number: '', daily_rate: '' })
      fetchCars()
    } catch (e) {
      setCarError(e.message)
    } finally {
      setAddingCar(false)
    }
  }

  const startRental = async () => {
    if (!rentingCarId) return
    if (!customerName.trim()) { setRentError('Customer name is required'); return }
    setRentError('')
    try {
      const res = await fetch(`${baseUrl}/api/rentals/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ car_id: rentingCarId, customer_name: customerName.trim() })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Failed (${res.status})`)
      }
      setRentingCarId(null)
      setCustomerName('')
      await fetchCars()
      await fetchActiveRentals()
    } catch (e) {
      setRentError(e.message)
    }
  }

  const returnRental = async () => {
    if (!returningRentalId) return
    try {
      const res = await fetch(`${baseUrl}/api/rentals/${returningRentalId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tax_rate: Number(taxRate || 0) })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Failed (${res.status})`)
      }
      const data = await res.json()
      setLastInvoice(data.invoice)
      setReturningRentalId(null)
      await fetchCars()
      await fetchActiveRentals()
      await fetchInvoices()
    } catch (e) {
      alert(`Return failed: ${e.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50 to-purple-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Car Rental</h1>
          <div className="text-xs sm:text-sm text-gray-500">Backend: <span className="font-mono">{baseUrl}</span></div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* Add Car */}
        <section className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Car</h2>
          <form onSubmit={handleAddCar} className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <input className="md:col-span-1 input" placeholder="Make" value={carForm.make} onChange={e=>setCarForm({...carForm, make:e.target.value})} />
            <input className="md:col-span-1 input" placeholder="Model" value={carForm.model} onChange={e=>setCarForm({...carForm, model:e.target.value})} />
            <input className="md:col-span-1 input" placeholder="Year" type="number" value={carForm.year} onChange={e=>setCarForm({...carForm, year:e.target.value})} />
            <input className="md:col-span-2 input" placeholder="Plate Number" value={carForm.plate_number} onChange={e=>setCarForm({...carForm, plate_number:e.target.value})} />
            <input className="md:col-span-1 input" placeholder="Daily Rate" type="number" step="0.01" value={carForm.daily_rate} onChange={e=>setCarForm({...carForm, daily_rate:e.target.value})} />
            <div className="md:col-span-6 flex gap-3 items-center">
              <button disabled={addingCar} className="btn-primary">{addingCar ? 'Adding...' : 'Add Car'}</button>
              {carError && <span className="text-red-600 text-sm">{carError}</span>}
            </div>
          </form>
        </section>

        {/* Cars List */}
        <section className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Cars</h2>
            <button className="btn-secondary" onClick={()=>{fetchCars()}}>Refresh</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cars.map(car => (
              <div key={car._id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-800">{car.make} {car.model}</div>
                  <span className={`px-2 py-1 rounded text-xs ${car.available ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{car.available ? 'Available' : 'Rented'}</span>
                </div>
                <div className="text-gray-600">Year: {car.year}</div>
                <div className="text-gray-600">Plate: {car.plate_number}</div>
                <div className="text-indigo-700 font-medium">${Number(car.daily_rate).toFixed(2)}/day</div>
                <div className="pt-2">
                  <button
                    disabled={!car.available}
                    onClick={()=>{ setRentingCarId(car._id); setCustomerName(''); setRentError('') }}
                    className={`btn-primary w-full ${!car.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >Start Rental</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Active Rentals */}
        <section className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Active Rentals</h2>
            <button className="btn-secondary" onClick={()=>{fetchActiveRentals()}}>Refresh</button>
          </div>
          {activeRentals.length === 0 ? (
            <p className="text-gray-500">No active rentals.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeRentals.map(r => (
                <div key={r._id} className="border rounded-lg p-4 space-y-2">
                  <div className="font-semibold text-gray-800">Customer: {r.customer_name}</div>
                  <div className="text-gray-600">Car ID: {r.car_id}</div>
                  <div className="text-gray-600">Start: {new Date(r.start_date).toLocaleString()}</div>
                  <div className="pt-2">
                    <button className="btn-danger w-full" onClick={()=>{ setReturningRentalId(r._id); setTaxRate('0.1') }}>Return & Generate Invoice</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Invoices */}
        <section className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Invoices</h2>
            <button className="btn-secondary" onClick={()=>{fetchInvoices()}}>Refresh</button>
          </div>
          {invoices.length === 0 ? (
            <p className="text-gray-500">No invoices yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 pr-6">Invoice ID</th>
                    <th className="py-2 pr-6">Customer</th>
                    <th className="py-2 pr-6">Days</th>
                    <th className="py-2 pr-6">Rate</th>
                    <th className="py-2 pr-6">Total</th>
                    <th className="py-2 pr-6">Period</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv._id} className="border-t">
                      <td className="py-2 pr-6 font-mono text-xs">{inv._id}</td>
                      <td className="py-2 pr-6">{inv.customer_name}</td>
                      <td className="py-2 pr-6">{inv.days}</td>
                      <td className="py-2 pr-6">${Number(inv.daily_rate).toFixed(2)}</td>
                      <td className="py-2 pr-6 font-medium">${Number(inv.total).toFixed(2)}</td>
                      <td className="py-2 pr-6">{new Date(inv.start_date).toLocaleDateString()} → {new Date(inv.end_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Start Rental Modal */}
      {rentingCarId && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold">Start Rental</h3>
            <input className="input w-full" placeholder="Customer Name" value={customerName} onChange={e=>setCustomerName(e.target.value)} />
            {rentError && <div className="text-red-600 text-sm">{rentError}</div>}
            <div className="flex justify-end gap-3 pt-2">
              <button className="btn-secondary" onClick={()=>{ setRentingCarId(null); setRentError('') }}>Cancel</button>
              <button className="btn-primary" onClick={startRental}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Return Rental Modal */}
      {returningRentalId && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold">Return Rental & Generate Invoice</h3>
            <label className="text-sm text-gray-600">Tax Rate (e.g., 0.1 for 10%)</label>
            <input className="input w-full" type="number" step="0.01" value={taxRate} onChange={e=>setTaxRate(e.target.value)} />
            <div className="flex justify-end gap-3 pt-2">
              <button className="btn-secondary" onClick={()=> setReturningRentalId(null)}>Cancel</button>
              <button className="btn-danger" onClick={returnRental}>Return</button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {lastInvoice && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl p-6 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Invoice</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={()=> setLastInvoice(null)}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Invoice ID:</span> <span className="font-mono">{lastInvoice._id}</span></div>
              <div><span className="text-gray-500">Customer:</span> {lastInvoice.customer_name}</div>
              <div><span className="text-gray-500">Days:</span> {lastInvoice.days}</div>
              <div><span className="text-gray-500">Rate:</span> ${Number(lastInvoice.daily_rate).toFixed(2)}</div>
              <div><span className="text-gray-500">Subtotal:</span> ${Number(lastInvoice.subtotal).toFixed(2)}</div>
              <div><span className="text-gray-500">Tax:</span> ${Number(lastInvoice.tax_amount).toFixed(2)} ({Number(lastInvoice.tax_rate)*100}%)</div>
              <div className="col-span-2 text-lg font-semibold mt-2">Total: ${Number(lastInvoice.total).toFixed(2)}</div>
              <div className="col-span-2 text-gray-600">Period: {new Date(lastInvoice.start_date).toLocaleString()} → {new Date(lastInvoice.end_date).toLocaleString()}</div>
            </div>
            <div className="pt-3 text-right">
              <button className="btn-primary" onClick={()=> setLastInvoice(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .input { @apply border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500; }
        .btn-primary { @apply bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg transition; }
        .btn-secondary { @apply bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium px-4 py-2 rounded-lg transition; }
        .btn-danger { @apply bg-rose-600 hover:bg-rose-700 text-white font-medium px-4 py-2 rounded-lg transition; }
      `}</style>
    </div>
  )
}

export default App
