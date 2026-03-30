import { useState, useEffect, useCallback } from "react";
import api from "../services/api.js";
import { useAutoRefresh } from "../hooks/useAutoRefresh.js";

const paymentConfig = {
  pix: { label: "PIX", color: "#4ade80" },
  dinheiro: { label: "Dinheiro", color: "#C9A84C" },
  cartao: { label: "Cartão", color: "#818cf8" },
  transferencia: { label: "Transferência", color: "#f472b6" },
};

const categories = ["Serviço", "Insumos", "Aluguel", "Equipamento", "Marketing", "Outros"];

const emptyForm = {
  type: "income", description: "", category: "Serviço",
  amount: "", date: "", payment: "pix", barber: "",
};

export default function Caixa() {
  const [transactions, setTransactions] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filterType, setFilterType] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [t, b] = await Promise.all([
        api.get("/beauty/transactions"),
        api.get("/beauty/barbers"),
      ]);
      setTransactions(t.data);
      setBarbers(b.data);
    } catch (e) {
      console.error("Erro ao buscar dados:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useAutoRefresh(fetchAll, 30000); // ← atualiza a cada 30s

  async function handleSubmit() {
    if (!form.description || !form.amount || !form.date) return;
    try {
      await api.post("/beauty/transactions", form);
      await fetchAll();
      setForm(emptyForm);
      setShowModal(false);
    } catch (e) {
      console.error("Erro ao salvar lançamento:", e);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/beauty/transactions/${id}`);
      await fetchAll();
    } catch (e) {
      console.error("Erro ao deletar lançamento:", e);
    }
  }

  const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  const filtered = transactions.filter(t => {
    const matchType = filterType === "all" || t.type === filterType;
    const matchPayment = filterPayment === "all" || t.payment === filterPayment;
    return matchType && matchPayment;
  });

  const byPayment = Object.entries(paymentConfig).map(([key, cfg]) => ({
    ...cfg, key,
    total: transactions.filter(t => t.payment === key && t.type === "income")
      .reduce((s, t) => s + t.amount, 0),
  })).filter(p => p.total > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="t-muted text-sm">Carregando caixa...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="t-text text-lg font-semibold">Caixa</h1>
          <p className="t-muted text-xs mt-0.5">Controle financeiro do período</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="t-btn-primary text-sm px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          + Lançamento
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Receita Total", value: `R$ ${income.toLocaleString("pt-BR")}`, color: "#4ade80", icon: "↑" },
          { label: "Despesas", value: `R$ ${expense.toLocaleString("pt-BR")}`, color: "#f87171", icon: "↓" },
          { label: "Saldo do Caixa", value: `R$ ${balance.toLocaleString("pt-BR")}`, color: balance >= 0 ? "var(--gold)" : "#f87171", icon: "◆" },
        ].map((s, i) => (
          <div key={i} className="t-card rounded-xl p-5">
            <div className="flex justify-between items-start mb-3">
              <span className="t-faint text-[11px] uppercase tracking-wider">{s.label}</span>
              <span className="text-lg font-bold" style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Formas de pagamento */}
      {byPayment.length > 0 && (
        <div className="t-card rounded-xl p-5">
          <div className="t-faint text-[11px] uppercase tracking-wider mb-4">Receita por forma de pagamento</div>
          <div className="grid grid-cols-4 gap-4">
            {byPayment.map(p => (
              <div key={p.key} className="t-inner rounded-lg p-3">
                <div className="text-[11px] mb-1" style={{ color: p.color }}>{p.label}</div>
                <div className="t-text text-lg font-bold">R$ {p.total}</div>
                <div className="h-1 rounded-full mt-2" style={{ background: "var(--bg-card)" }}>
                  <div className="h-full rounded-full"
                    style={{ width: `${income > 0 ? (p.total / income) * 100 : 0}%`, background: p.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="flex gap-2">
          {[
            { value: "all", label: "Todos" },
            { value: "income", label: "Receitas" },
            { value: "expense", label: "Despesas" },
          ].map(f => (
            <button key={f.value} onClick={() => setFilterType(f.value)}
              className="text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer"
              style={{
                background: filterType === f.value ? "var(--gold-bg)" : "transparent",
                color: filterType === f.value ? "var(--gold)" : "var(--text-muted)",
                borderColor: filterType === f.value ? "var(--gold-border)" : "var(--border)",
              }}>
              {f.label}
            </button>
          ))}
        </div>
        <select value={filterPayment} onChange={e => setFilterPayment(e.target.value)}
          className="t-select text-sm px-3 py-2 rounded-lg cursor-pointer">
          <option value="all">Todas as formas</option>
          {Object.entries(paymentConfig).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
      </div>

      {/* Tabela */}
      <div className="t-card rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="t-row">
              {["Data", "Descrição", "Categoria", "Pagamento", "Barbeiro", "Valor", "Ação"].map(h => (
                <th key={h} className="t-th px-5 py-3 text-left text-[11px] uppercase tracking-wider font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center t-faint text-sm">Nenhum lançamento encontrado</td></tr>
            ) : (
              filtered.map((t, i) => {
                const pc = paymentConfig[t.payment] || { label: t.payment, color: "#888" };
                return (
                  <tr key={t.id} className={i < filtered.length - 1 ? "t-row" : ""}>
                    <td className="px-5 py-3 t-muted text-sm">
                      {new Date(t.date).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span style={{ color: t.type === "income" ? "#4ade80" : "#f87171" }}>
                          {t.type === "income" ? "↑" : "↓"}
                        </span>
                        <span className="t-text text-sm">{t.description}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 t-muted text-sm">{t.category}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-1 rounded t-inner" style={{ color: pc.color }}>
                        {pc.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 t-muted text-sm">{t.barber || "—"}</td>
                    <td className="px-5 py-3 text-sm font-medium"
                      style={{ color: t.type === "income" ? "#4ade80" : "#f87171" }}>
                      {t.type === "income" ? "+" : "-"}R$ {t.amount}
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => handleDelete(t.id)}
                        className="text-[11px] text-[#f87171] hover:opacity-75 transition-opacity cursor-pointer">
                        Remover
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="t-modal rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-5">
              <h2 className="t-text text-sm font-semibold">Novo Lançamento</h2>
              <button onClick={() => setShowModal(false)} className="t-muted hover:opacity-75 cursor-pointer text-lg">✕</button>
            </div>
            <div className="flex flex-col gap-3">

              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "income", label: "Receita", color: "#4ade80" },
                  { value: "expense", label: "Despesa", color: "#f87171" },
                ].map(t => (
                  <button key={t.value} onClick={() => setForm(f => ({ ...f, type: t.value }))}
                    className="py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer"
                    style={{
                      background: form.type === t.value ? t.color + "20" : "var(--bg-tertiary)",
                      color: form.type === t.value ? t.color : "var(--text-muted)",
                      borderColor: form.type === t.value ? t.color + "50" : "var(--border)",
                    }}>
                    {t.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="t-muted text-[11px] uppercase tracking-wider block mb-1">Descrição</label>
                <input type="text" placeholder="Ex: Corte — João Silva" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="t-input w-full text-sm px-3 py-2 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="t-muted text-[11px] uppercase tracking-wider block mb-1">Valor (R$)</label>
                  <input type="number" placeholder="0" value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="t-input w-full text-sm px-3 py-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="t-muted text-[11px] uppercase tracking-wider block mb-1">Data</label>
                  <input type="date" value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="t-input w-full text-sm px-3 py-2 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="t-muted text-[11px] uppercase tracking-wider block mb-1">Categoria</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="t-select w-full text-sm px-3 py-2 rounded-lg cursor-pointer">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="t-muted text-[11px] uppercase tracking-wider block mb-1">Pagamento</label>
                  <select value={form.payment} onChange={e => setForm(f => ({ ...f, payment: e.target.value }))}
                    className="t-select w-full text-sm px-3 py-2 rounded-lg cursor-pointer">
                    {Object.entries(paymentConfig).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {form.type === "income" && (
                <div>
                  <label className="t-muted text-[11px] uppercase tracking-wider block mb-1">Barbeiro</label>
                  <select value={form.barber} onChange={e => setForm(f => ({ ...f, barber: e.target.value }))}
                    className="t-select w-full text-sm px-3 py-2 rounded-lg cursor-pointer">
                    <option value="">Selecione</option>
                    {barbers.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 t-inner t-muted text-sm py-2 rounded-lg transition-colors cursor-pointer t-hover">
                  Cancelar
                </button>
                <button onClick={handleSubmit}
                  className="flex-1 t-btn-primary text-sm py-2 rounded-lg transition-colors cursor-pointer">
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}