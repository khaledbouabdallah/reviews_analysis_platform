from setuptools import setup, find_packages

setup(
    name="complaint-management-platform",
    version="0.1.0",
    description="AI-Based Complaint and Suggestion Management Platform",
    author="BOUABDALLAH Khaled",
    author_email="Bouabdallah.khaled@yahoo.com",
    packages=find_packages("src"),
    package_dir={"": "src"},
    python_requires=">=3.10.12",
    install_requires=[
        # Core dependencies
        "fastapi>=0.95.0",
        "uvicorn>=0.21.0",
        "pydantic>=1.10.7",

        # NLP and ML libraries
        "nltk>=3.8.1",
        "textblob>=0.17.1",
        "langdetect>=1.0.9",
        "fasttext>=0.9.2",

        # Web scraping libraries
        "urllib3==1.26.16",
        "selenium==3.141.0",
    ],
    extras_require={
        "dev": [
            "pytest>=6.0.0",
            "pytest-cov>=2.12.0",
            "black>=23.0.0",
            "isort>=5.12.0",
            "pylint>=2.17.0",
        ],
    },
)