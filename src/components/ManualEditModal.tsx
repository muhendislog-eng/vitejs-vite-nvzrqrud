import React, { useState, useEffect } from 'react';

const ManualEditModal = ({ isOpen, item, onClose, onSave }: any) => {
  const [form, setForm] = useState(item);

  useEffect(() => {
    setForm(item);
  }, [item]);

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 className="text-lg font-bold mb-4">Manuel Poz Düzenle</h3>

        <div className="space-y-3">
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={form.pos}
            onChange={e => setForm({ ...form, pos: e.target.value })}
            placeholder="Poz No"
          />
          <textarea
            className="w-full border rounded-lg px-3 py-2"
            value={form.desc}
            onChange={e => setForm({ ...form, desc: e.target.value })}
            placeholder="Açıklama"
          />
          <input
            className="w-full border rounded-lg px-3 py-2"
            value={form.unit}
            disabled
          />
          <input
            type="number"
            className="w-full border rounded-lg px-3 py-2"
            value={form.price}
            onChange={e => setForm({ ...form, price: Number(e.target.value) })}
            placeholder="Birim Fiyat"
          />
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-200">
            İptal
          </button>
          <button
            onClick={() => onSave(form)}
            className="px-4 py-2 rounded-lg bg-orange-600 text-white"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualEditModal;
