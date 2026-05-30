# tests/agents/test_trader.py
import pytest
from langchain_core.messages import SystemMessage, HumanMessage

from src.agents import trader as trader_mod
from src.llm.schemas import TradeProposal


@pytest.mark.asyncio
async def test_trader_maps_llm_output_to_trade_proposal(monkeypatch, make_fake_llm):
    proposal = TradeProposal(action="BUY", conviction=0.82, score=74, rationale="strong setup")
    fake = make_fake_llm([proposal])
    monkeypatch.setattr(trader_mod, "get_llm", lambda tier: fake)

    state = {
        "ticker": "AAPL",
        "resolved_ticker": "AAPL",
        "analyst_reports": {
            "news": {"summary": "upbeat coverage", "confidence": 0.6},
            "fundamentals": {"summary": "P/E reasonable", "confidence": 0.7},
            "technicals": {"summary": "RSI neutral", "confidence": 0.5},
        },
        "research_debate": {
            "bull_thesis": "growth", "bear_thesis": "valuation",
            "facilitator_verdict": "lean bullish",
        },
    }

    out = await trader_mod.trader(state)

    assert out["trade_proposal"] == proposal.model_dump()
    assert out["trade_proposal"]["action"] == "BUY"
    assert out["trade_proposal"]["score"] == 74
    # deep tier requested for structured output via function_calling
    assert fake.structured_args[0]["schema"] is TradeProposal
    assert fake.structured_args[0]["method"] == "function_calling"


@pytest.mark.asyncio
async def test_trader_emits_metrics_and_passes_callback(monkeypatch, make_fake_llm):
    proposal = TradeProposal(action="HOLD", conviction=0.5, score=50, rationale="mixed")
    fake = make_fake_llm([proposal])
    monkeypatch.setattr(trader_mod, "get_llm", lambda tier: fake)

    out = await trader_mod.trader({"ticker": "AAPL", "analyst_reports": {}, "research_debate": {}})

    assert isinstance(out["run_metrics"], list)
    assert out["run_metrics"][0]["node"] == "trader"
    # the CostTracker was passed as a callback on the LLM call
    cfg = fake.structured[0].calls[0]["config"]
    assert "callbacks" in cfg and len(cfg["callbacks"]) == 1


@pytest.mark.asyncio
async def test_trader_prompt_includes_facilitator_verdict(monkeypatch, make_fake_llm):
    proposal = TradeProposal(action="SELL", conviction=0.6, score=30, rationale="overvalued")
    fake = make_fake_llm([proposal])
    monkeypatch.setattr(trader_mod, "get_llm", lambda tier: fake)

    await trader_mod.trader({
        "ticker": "AAPL",
        "analyst_reports": {"news": {"summary": "x"}},
        "research_debate": {"facilitator_verdict": "lean bearish on valuation"},
    })

    messages = fake.structured[0].calls[0]["messages"]
    assert isinstance(messages[0], SystemMessage)
    assert isinstance(messages[1], HumanMessage)
    assert "lean bearish on valuation" in messages[1].content
