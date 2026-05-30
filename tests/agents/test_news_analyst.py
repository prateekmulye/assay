
from src.agents.analysts import news as news_mod
from src.agents.analysts.news import news_analyst
from src.llm.schemas import AnalystReport
from src.tools import ToolError
from src.tools.firecrawl import NewsHit


class _FakeStructured:
    def __init__(self, result):
        self._result = result

    async def ainvoke(self, messages, config=None):
        return self._result


class _FakeLLM:
    def __init__(self, result):
        self._result = result

    def with_structured_output(self, schema, method=None):
        return _FakeStructured(self._result)


def _install_llm(monkeypatch, report):
    monkeypatch.setattr(news_mod, "get_llm", lambda tier: _FakeLLM(report))


async def test_news_analyst_happy_path(monkeypatch):
    hits = [NewsHit(title="Apple beats earnings", url="https://x.com", snippet="strong q", markdown=None)]
    monkeypatch.setattr(news_mod, "search_news", lambda q, limit=5: hits)
    report = AnalystReport(summary="Positive coverage", key_points=["earnings beat"], confidence=0.7,
                           citations=["https://x.com"])
    _install_llm(monkeypatch, report)
    out = await news_analyst({"resolved_ticker": "AAPL"})
    assert "news" in out["analyst_reports"]
    assert out["analyst_reports"]["news"]["summary"] == "Positive coverage"
    assert out["run_metrics"][0]["node"] == "news_analyst"


async def test_news_analyst_tool_failure_degrades(monkeypatch):
    def _boom(q, limit=5):
        raise ToolError("firecrawl", "429")

    monkeypatch.setattr(news_mod, "search_news", _boom)
    # get_llm must NOT be called on the failure path
    monkeypatch.setattr(news_mod, "get_llm", lambda tier: (_ for _ in ()).throw(AssertionError("llm called")))
    out = await news_analyst({"resolved_ticker": "AAPL"})
    rep = out["analyst_reports"]["news"]
    assert rep["confidence"] == 0.0
    assert "firecrawl" in rep["summary"].lower() or "unavailable" in rep["summary"].lower()
    assert out["run_metrics"][0]["node"] == "news_analyst"


async def test_news_analyst_empty_hits_degrades(monkeypatch):
    monkeypatch.setattr(news_mod, "search_news", lambda q, limit=5: [])
    monkeypatch.setattr(news_mod, "get_llm", lambda tier: (_ for _ in ()).throw(AssertionError("llm called")))
    out = await news_analyst({"resolved_ticker": "AAPL"})
    assert out["analyst_reports"]["news"]["confidence"] == 0.0
