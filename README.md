# 🏭 Controle de Produção — Click Impresso

Sistema interno para acompanhar **Ordens de Serviço (OS)** ao longo da produção,
no estilo **esteira / Kanban**: cada **setor é uma coluna** e cada **OS é um cartão**
que caminha pelas etapas até ficar pronto.

## O que ele faz

- ➕ **Cadastro de OS** com número, cliente, descrição, prioridade, prazo e observações.
- 🏭 **Esteira ao vivo**: a OS anda pelos setores. Cada setor **libera** o trabalho para o próximo.
- 🔔 **Aviso de coleta**: quando um setor libera, o próximo recebe um **alerta visual + som** de que há material pronto para coletar.
- ⏱️ **Tempo parado**: cada cartão mostra há quanto tempo está parado, mudando de cor quando demora demais.
- 📅 **Agendadas**: trabalhos que entram nos próximos dias ficam separados até a data.
- 📊 **Resumo do gerente**: o que está pronto, o que está parado há mais tempo, carga por setor e concluídas no dia.
- ⚙️ **Setores configuráveis**: adicione, renomeie, reordene e troque a cor das etapas.

## Como rodar

```bash
npm install
npm run dev      # abre em http://localhost:5173
npm run build    # gera a versão de produção em /dist
```

## Modos de operação

| Modo | Quando | Dados |
|------|--------|-------|
| 🟡 **Demonstração** | Sem variáveis de ambiente | Salvos só no navegador (localStorage) |
| 🟢 **Tempo real** | Com Supabase configurado | No banco, compartilhados entre todos os setores |

### Conectar o Supabase (tempo real)

1. Crie um projeto no [Supabase](https://supabase.com) e rode o SQL de
   `supabase/migrations/0001_init.sql` no **SQL Editor**.
2. Copie `.env.example` para `.env.local` e preencha:

   ```
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon
   ```

3. Reinicie o `npm run dev`. O cabeçalho deve mostrar **🟢 Tempo real**.

## Stack

React + Vite + TypeScript + Tailwind CSS, com Supabase (Postgres + Realtime) como backend.
