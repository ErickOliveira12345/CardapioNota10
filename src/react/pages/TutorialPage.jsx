import React from "react";

import "../styles/tutorial.css";

export default function TutorialPage({
  onNavigate,
}) {
  const steps = [
    {
      number: "1",
      icon: "👤",
      title: "Crie sua conta",
      description:
        "Cadastre seu estabelecimento e conclua a configuração inicial para começar a usar o Cardápio Nota10.",
    },
    {
      number: "2",
      icon: "🏪",
      title: "Configure seu estabelecimento",
      description:
        "Adicione nome, endereço, identidade visual e as principais configurações do seu negócio.",
    },
    {
      number: "3",
      icon: "🍔",
      title: "Cadastre categorias e produtos",
      description:
        "Organize seu cardápio em categorias e adicione produtos com nome, descrição, foto e preço.",
    },
    {
      number: "4",
      icon: "📱",
      title: "Crie suas mesas e QR Codes",
      description:
        "Cadastre as mesas do estabelecimento e gere os QR Codes para seus clientes acessarem o cardápio.",
    },
    {
      number: "5",
      icon: "🛒",
      title: "Receba pedidos",
      description:
        "O cliente acessa o cardápio, escolhe os produtos e envia o pedido diretamente pelo sistema.",
    },
    {
      number: "6",
      icon: "🍳",
      title: "Acompanhe o preparo",
      description:
        "Gerencie o pedido desde o recebimento, passando pelo preparo, até ficar pronto para o cliente ou para entrega.",
    },
    {
      number: "7",
      icon: "🛵",
      title: "Utilize entregadores",
      description:
        "Nos planos compatíveis, pedidos para entrega podem ser disponibilizados aos entregadores cadastrados.",
    },
    {
      number: "8",
      icon: "📊",
      title: "Acompanhe seu negócio",
      description:
        "Use o painel administrativo para acompanhar pedidos, vendas, recursos do plano e outras informações do estabelecimento.",
    },
  ];

  return (
    <main className="tutorial-page">
      <section className="tutorial-hero">
        <button
          type="button"
          className="tutorial-back-button"
          onClick={() =>
            onNavigate?.("/")
          }
        >
          ← Voltar
        </button>

        <div className="tutorial-hero__content">
          <span className="tutorial-eyebrow">
            Tutorial
          </span>

          <h1>
            Como funciona o Cardápio Nota10?
          </h1>

          <p>
            Veja o passo a passo para
            configurar seu estabelecimento,
            criar seu cardápio digital e
            começar a receber pedidos.
          </p>
        </div>
      </section>

      <section className="tutorial-intro">
        <div>
          <span>
            🍽️
          </span>

          <h2>
            Do cadastro ao primeiro pedido
          </h2>

          <p>
            O Cardápio Nota10 foi pensado
            para centralizar a operação do
            estabelecimento em um único
            sistema.
          </p>
        </div>
      </section>

      <section className="tutorial-steps">
        {steps.map((step) => (
          <article
            key={step.number}
            className="tutorial-step-card"
          >
            <div className="tutorial-step-card__top">
              <span className="tutorial-step-number">
                {step.number}
              </span>

              <span className="tutorial-step-icon">
                {step.icon}
              </span>
            </div>

            <h2>
              {step.title}
            </h2>

            <p>
              {step.description}
            </p>
          </article>
        ))}
      </section>

      <section className="tutorial-flow">
        <header>
          <span>
            Fluxo básico
          </span>

          <h2>
            Veja como tudo se conecta
          </h2>
        </header>

        <div className="tutorial-flow__content">
          <div>
            <span>1</span>
            <strong>
              Cliente acessa
            </strong>
            <p>
              QR Code ou link de entrega.
            </p>
          </div>

          <span className="tutorial-flow__arrow">
            →
          </span>

          <div>
            <span>2</span>
            <strong>
              Faz o pedido
            </strong>
            <p>
              Produtos são enviados ao
              estabelecimento.
            </p>
          </div>

          <span className="tutorial-flow__arrow">
            →
          </span>

          <div>
            <span>3</span>
            <strong>
              Pedido é preparado
            </strong>
            <p>
              A cozinha acompanha o
              andamento.
            </p>
          </div>

          <span className="tutorial-flow__arrow">
            →
          </span>

          <div>
            <span>4</span>
            <strong>
              Pedido concluído
            </strong>
            <p>
              Mesa ou entrega finalizada.
            </p>
          </div>
        </div>
      </section>

      <section className="tutorial-cta">
        <span>
          🚀
        </span>

        <h2>
          Pronto para começar?
        </h2>

        <p>
          Crie sua conta, configure seu
          estabelecimento e comece a
          utilizar o Cardápio Nota10.
        </p>

        <div className="tutorial-cta__actions">
          <button
            type="button"
            className="tutorial-primary-button"
            onClick={() =>
              onNavigate?.("/login")
            }
          >
            Criar Conta
          </button>

          <button
            type="button"
            className="tutorial-secondary-button"
            onClick={() =>
              onNavigate?.("/")
            }
          >
            Voltar à Página Inicial
          </button>
        </div>
      </section>
    </main>
  );
}