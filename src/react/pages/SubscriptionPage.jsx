import { useSubscription } from "../contexts/SubscriptionContext";

import "../styles/subscription.css";

export default function SubscriptionPage() {

    const {
        subscription,
        plan,
        loading
    } = useSubscription();

    function navigateTo(path) {
        window.history.pushState({}, "", path);
        window.dispatchEvent(new PopStateEvent("popstate"));
    }

    if (loading) {
        return (
            <div className="subscription-page">
                <div className="subscription-loading">
                    Carregando assinatura...
                </div>
            </div>
        );
    }

    return (

        <div className="subscription-page">

            <div className="subscription-header">

                <div>

                    <h1>Minha Assinatura</h1>

                    <p>
                        Gerencie seu plano,
                        pagamentos e recursos.
                    </p>

                </div>

                <button
                    className="subscription-change-button"
                    onClick={() => navigateTo("/planos")}
                >
                    Alterar Plano
                </button>

            </div>


            <div className="subscription-summary">

                <div className="summary-card">

                    <span>Plano Atual</span>

                    <h2>
                        {plan?.nome || "Nenhum"}
                    </h2>

                </div>


                <div className="summary-card">

                    <span>Status</span>

                    <h2>
                        {subscription?.status || "-"}
                    </h2>

                </div>


                <div className="summary-card">

                    <span>Valor</span>

                    <h2>

                        {plan
                            ? `R$ ${Number(plan.preco).toFixed(2)}`
                            : "--"}

                    </h2>

                </div>

            </div>


            <div className="subscription-actions">

                <button
                    onClick={() => navigateTo("/billing")}
                >
                    Cobranças
                </button>

                <button
                    onClick={() => navigateTo("/planos")}
                >
                    Ver Planos
                </button>

                <button disabled>
                    Histórico
                </button>

            </div>


            <div className="subscription-features">

                <h2>
                    Recursos Liberados
                </h2>

                {

                    plan?.recursos &&
                    Object.entries(plan.recursos).map(

                        ([key, value]) => (

                            <div
                                key={key}
                                className="feature-item"
                            >

                                <span>

                                    {value
                                        ? "✅"
                                        : "❌"}

                                </span>

                                <strong>
                                    {key}
                                </strong>

                            </div>

                        )

                    )

                }

            </div>

        </div>

    );

}