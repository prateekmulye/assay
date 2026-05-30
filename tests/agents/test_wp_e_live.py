# tests/agents/test_wp_e_live.py
import os
import pytest

from src.agents.trader import trader
from src.agents.risk.arbiter import risk_arbiter

pytestmark = pytest.mark.skipif(os.getenv("RUN_LIVE") != "1", reason="set RUN_LIVE=1 to run")


@pytest.mark.live
@pytest.mark.asyncio
async def test_trader_then_arbiter_live():
    state = {
        "ticker": "AAPL",
        "resolved_ticker": "AAPL",
        "investor_mode": "Neutral",
        "analyst_reports": {
            "news": {"summary": "Steady demand; services growth.", "confidence": 0.6},
            "fundamentals": {"summary": "Healthy margins, premium valuation.", "confidence": 0.6},
            "technicals": {"summary": "Range-bound, RSI ~50.", "confidence": 0.5},
        },
        "research_debate": {
            "bull_thesis": "Services + buybacks.",
            "bear_thesis": "Valuation rich, hardware mature.",
            "facilitator_verdict": "Lean neutral-to-bullish.",
        },
    }
    tout = await trader(state)
    assert tout["trade_proposal"]["action"] in {"BUY", "SELL", "HOLD"}

    state.update(tout)
    state["risk_debate"] = {"conservative": "Trim into strength.", "aggressive": "Add on dips."}
    aout = await risk_arbiter(state)
    assert aout["final_decision"]["action"] in {"BUY", "SELL", "HOLD"}
    assert 0 <= aout["final_decision"]["score"] <= 100
