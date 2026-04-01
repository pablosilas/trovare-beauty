import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import api from "../services/api.js";
import { useAutoRefresh } from "../hooks/useAutoRefresh.js";

const emptyForm = { name: "", phone: "", specialty: "", commissionPct: 40, status: "active" };
const colors = ["#C9A84C", "#7C6F5E", "#4A7C6F", "#818cf8", "#f472b6"];

export default function Barbeiros() {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchBarbers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/beauty/barbers");
      setBarbers(data);
    } catch (e) {
      console.error("Erro ao buscar barbeiros:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBarbers(); }, [fetchBarbers]);
  useAutoRefresh(fetchBarbers, 30000); // ← atualiza a cada 30s

  function openNew() {
    setSelected(null);
    setForm(emptyForm);
    setShowModal(true);
  }

  function openEdit(b) {
    setSelected(b);
    setForm({ name: b.name, phone: b.phone, specialty: b.specialty, commissionPct: b.commissionPct, status: b.status });
    setShowModal(true);
  }

  async function handleSubmit() {
    if (!form.name || !form.phone) return;
    try {
      if (selected) {
        await api.put(`/beauty/barbers/${selected.id}`, form);
      } else {
        await api.post("/beauty/barbers", form);
      }
      await fetchBarbers();
      setShowModal(false);
    } catch (e) {
      console.error("Erro ao salvar barbeiro:", e);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/beauty/barbers/${id}`);
      await fetchBarbers();
    } catch (e) {
      console.error("Erro ao deletar barbeiro:", e);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="t-muted text-sm">Carregando barbeiros...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="t-text text-lg font-semibold">Barbeiros</h1>
          <p className="t-muted text-xs mt-0.5">{barbers.filter(b => b.status === "active").length} barbeiros ativos</p>
        </div>
        <button onClick={openNew}
          className="t-btn-primary text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          + Novo Barbeiro
        </button>
      </div>

      {/* Sem barbeiros */}
      {barbers.length === 0 ? (
        <div className="t-card rounded-xl p-12 text-center">
          <div className="t-muted text-sm mb-3">Nenhum barbeiro cadastrado</div>
          <button onClick={openNew} className="text-sm hover:opacity-75 cursor-pointer"
            style={{ color: "var(--gold)" }}>
            + Cadastrar primeiro barbeiro
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {barbers.map((b, idx) => {
            const color = colors[idx % colors.length];
            return (
              <div key={b.id} className="t-card rounded-xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: color + "20", border: `2px solid ${color}40`, color }}>
                      {b.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <div className="t-text text-sm font-semibold">{b.name}</div>
                      <div className="t-muted text-xs">{b.specialty || "Sem especialidade"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full"
                      style={{ background: b.status === "active" ? "#4ade80" : "var(--text-muted)" }} />
                    <span className="text-[10px]"
                      style={{ color: b.status === "active" ? "#4ade80" : "var(--text-muted)" }}>
                      {b.status === "active" ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>

                <div className="t-muted text-xs mb-4">{b.phone}</div>

                <div className="mb-4">
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="t-muted">Comissão</span>
                    <span style={{ color }}>{b.commissionPct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "var(--bg-card)" }}>
                    <div className="h-full rounded-full" style={{ width: `${b.commissionPct}%`, background: color }} />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => openEdit(b)}
                    className="flex-1 text-xs py-1.5 rounded-lg transition-colors cursor-pointer t-inner t-muted t-hover">
                    Editar
                  </button>
                  <button onClick={() => handleDelete(b.id)}
                    className="flex-1 text-xs py-1.5 rounded-lg transition-colors cursor-pointer text-[#f87171]"
                    style={{ background: "#f871711a" }}>
                    Remover
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="t-modal rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-5">
              <h2 className="t-text text-sm font-semibold">{selected ? "Editar Barbeiro" : "Novo Barbeiro"}</h2>
              <button onClick={() => setShowModal(false)} className="t-muted hover:opacity-75 cursor-pointer"><X size={16} /></button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="t-muted text-[11px] uppercase tracking-wider block mb-1">Nome</label>
                <input type="text" placeholder="Nome completo" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="t-input w-full text-sm px-3 py-2 rounded-lg"
                />
              </div>
              <div>
                <label className="t-muted text-[11px] uppercase tracking-wider block mb-1">Telefone</label>
                <input type="text" placeholder="(11) 99999-0000" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="t-input w-full text-sm px-3 py-2 rounded-lg"
                />
              </div>
              <div>
                <label className="t-muted text-[11px] uppercase tracking-wider block mb-1">Especialidade</label>
                <input type="text" placeholder="Ex: Degradê, Navalhado..." value={form.specialty}
                  onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
                  className="t-input w-full text-sm px-3 py-2 rounded-lg"
                />
              </div>
              <div>
                <label className="t-muted text-[11px] uppercase tracking-wider block mb-1">
                  Comissão — <span style={{ color: "var(--gold)" }}>{form.commissionPct}%</span>
                </label>
                <input type="range" min={10} max={60} value={form.commissionPct}
                  onChange={e => setForm(f => ({ ...f, commissionPct: Number(e.target.value) }))}
                  className="w-full cursor-pointer accent-[var(--gold)]"
                />
              </div>
              <div>
                <label className="t-muted text-[11px] uppercase tracking-wider block mb-1">Status</label>
                <select value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="t-select w-full text-sm px-3 py-2 rounded-lg cursor-pointer">
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 t-inner t-muted text-sm py-2 rounded-lg transition-colors cursor-pointer t-hover">
                  Cancelar
                </button>
                <button onClick={handleSubmit}
                  className="flex-1 t-btn-primary text-sm py-2 rounded-lg transition-colors cursor-pointer">
                  {selected ? "Salvar" : "Cadastrar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}