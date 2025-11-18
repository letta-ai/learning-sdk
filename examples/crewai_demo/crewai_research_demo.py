"""
CrewAI Research Demo - Agentic Learning SDK

This example shows how to add persistent memory to CrewAI agents using
the Agentic Learning SDK. The demo creates a research crew that remembers
information across different sessions.

Prerequisites:
    pip install agentic-learning crewai crewai-tools openai
    export OPENAI_API_KEY="your-api-key"
    export LETTA_API_KEY="your-api-key"

Usage:
    python3 crewai_research_demo.py
"""

from crewai import Agent, Task, Crew, Process
from crewai_tools import SerperDevTool
from agentic_learning import learning


def create_research_crew():
    search_tool = SerperDevTool()
    
    researcher = Agent(
        role='Senior Researcher',
        goal='Research and gather comprehensive information',
        backstory='An experienced researcher with deep expertise in information gathering',
        tools=[search_tool],
        verbose=True,
        allow_delegation=False
    )
    
    writer = Agent(
        role='Content Writer',
        goal='Write engaging and informative content',
        backstory='A skilled writer who transforms research into clear, compelling narratives',
        verbose=True,
        allow_delegation=False
    )
    
    return researcher, writer


def run_research(topic: str, researcher: Agent, writer: Agent):
    research_task = Task(
        description=f'Research the latest developments in {topic}',
        agent=researcher,
        expected_output='A comprehensive research summary'
    )
    
    writing_task = Task(
        description='Write a brief, engaging article based on the research',
        agent=writer,
        expected_output='A 2-3 paragraph article',
        context=[research_task]
    )
    
    crew = Crew(
        agents=[researcher, writer],
        tasks=[research_task, writing_task],
        process=Process.sequential,
        verbose=True
    )
    
    # This is literally all you need to add memory to your crewai agents.
    with learning(agent="crewai-research-demo", memory=["human", "research", "notes"]):
        result = crew.kickoff()
        return result


if __name__ == "__main__":
    print("🚀 Starting CrewAI Research Demo with Memory\\n")
    
    researcher, writer = create_research_crew()
    
    print("=" * 60)
    print("First Research: AI Agents")
    print("=" * 60)
    result1 = run_research("AI agents", researcher, writer)
    print(f"\\n✅ Result:\\n{result1}\\n")
    
    print("=" * 60)
    print("Second Research: AI Memory")
    print("=" * 60)
    result2 = run_research("AI Memory", researcher, writer)
    print(f"\\n✅ Result:\\n{result2}\\n")
    
    print("=" * 60)
    print("\\n💡 The crew's memory persists across tasks!")
    print("Try running this script again - it will remember previous research.\\n")
