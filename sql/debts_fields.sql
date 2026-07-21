-- ============================================================================
-- NEXORA FINANCIAL — MIGRAÇÃO: campos adicionais em "debts"
-- ============================================================================
-- Execute UMA ÚNICA VEZ no SQL Editor do Supabase (projeto já existente).
-- Adiciona "type", "creditor", "paid_amount" e "notes" à tabela debts,
-- usados pela tela de Dívidas (Fase 10). Não apaga nem altera dados
-- existentes — installments_total/installments_paid continuam existindo,
-- agora como informação complementar opcional.
-- ============================================================================

alter table public.debts
  add column if not exists type text,
  add column if not exists creditor text,
  add column if not exists paid_amount numeric(14,2) not null default 0,
  add column if not exists notes text;

alter table public.debts
  add constraint debts_paid_amount_non_negative check (paid_amount >= 0);

comment on column public.debts.type is 'Tipo livre da dívida (Cartão, Empréstimo, Financiamento, Outro) — não é uma FK.';
comment on column public.debts.creditor is 'Nome do credor/instituição.';
comment on column public.debts.paid_amount is 'Valor já pago — principal indicador de progresso (substitui o cálculo por parcelas).';
comment on column public.debts.notes is 'Observações livres sobre a dívida.';

-- installments_total/installments_paid deixam de ser obrigatórios: agora
-- são um detalhe complementar opcional, não a forma principal de medir
-- progresso.
alter table public.debts
  alter column installments_total drop not null,
  alter column installments_total drop default,
  alter column installments_paid drop not null,
  alter column installments_paid drop default;
