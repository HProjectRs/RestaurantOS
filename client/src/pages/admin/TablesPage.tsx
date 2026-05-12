import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { Table } from '../../types'
import { Plus, QrCode, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from '../../i18n/useTranslation'

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-700 border-green-200',
  OCCUPIED: 'bg-red-100 text-red-700 border-red-200',
  RESERVED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  MAINTENANCE: 'bg-gray-100 text-gray-700 border-gray-200',
}

export default function TablesPage() {
  const { t } = useTranslation()
  const statusText: Record<string, string> = {
    AVAILABLE: t('tables.status.available'),
    OCCUPIED: t('tables.status.occupied'),
    RESERVED: t('tables.status.reserved'),
    MAINTENANCE: t('tables.status.maintenance'),
  }
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTable, setEditingTable] = useState<Table | null>(null)

  const loadTables = () => {
    api.getTables()
      .then(setTables)
      .catch(() => toast.error('فشل تحميل الطاولات'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadTables() }, [])

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const data = {
      number: form.get('number'),
      capacity: parseInt(form.get('capacity') as string) || 4,
    }
    try {
      if (editingTable) {
        await api.updateTable(editingTable.id, data)
        toast.success('تم تحديث الطاولة')
      } else {
        await api.createTable(data)
        toast.success('تم إضافة الطاولة')
      }
      setShowModal(false)
      setEditingTable(null)
      loadTables()
    } catch (err: any) { toast.error(err.message) }
  }

  const handleRegenerateQr = async (id: string) => {
    try {
      await api.regenerateTableQr(id)
      toast.success('تم تجديد رمز QR')
      loadTables()
    } catch { toast.error('فشل التجديد') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد؟')) return
    try {
      await api.deleteTable(id)
      toast.success('تم حذف الطاولة')
      loadTables()
    } catch { toast.error('فشل الحذف') }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.updateTableStatus(id, status)
      loadTables()
    } catch { toast.error('فشل التحديث') }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('tables.title')}</h1>
          <p className="text-gray-500">{t('tables.subtitle')}</p>
        </div>
        <button onClick={() => { setEditingTable(null); setShowModal(true) }} className="btn-primary text-sm py-2">
          <Plus size={16} className="inline ml-1" /> {t('tables.add')}
        </button>
      </div>

      <div className="table-grid">
        {tables.map(table => (
          <div
            key={table.id}
            className={`card text-center border-2 transition-all ${statusColors[table.status]}`}
          >
            <div className="text-3xl font-bold mb-1">{table.number}</div>
            <div className="text-xs opacity-75 mb-2">{t('tables.capacity')}: {table.capacity}</div>
            <div className="text-xs font-semibold mb-3">{statusText[table.status]}</div>

            <div className="flex justify-center gap-1">
              <select
                value={table.status}
                onChange={e => handleStatusChange(table.id, e.target.value)}
                className="text-xs px-2 py-1 rounded-lg border bg-white"
              >
                {Object.entries(statusText).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <button onClick={() => handleRegenerateQr(table.id)} className="p-1.5 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100" title="QR">
                <QrCode size={14} />
              </button>
              <button onClick={() => { setEditingTable(table); setShowModal(true) }} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <Edit2 size={14} />
              </button>
              <button onClick={() => handleDelete(table.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">{editingTable ? t('edit') : t('tables.add')}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('tables.table_number')}</label>
                <input name="number" defaultValue={editingTable?.number || ''} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('tables.capacity')}</label>
                <input name="capacity" type="number" defaultValue={editingTable?.capacity || 4} className="input-field" required />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary flex-1">{editingTable ? t('save') : t('add')}</button>
                <button type="button" onClick={() => { setShowModal(false); setEditingTable(null) }} className="btn-secondary flex-1">{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
