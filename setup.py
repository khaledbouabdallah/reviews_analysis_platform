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
        # Add your dependencies here
        # For example:
        # "fastapi>=0.68.0",
        # "sqlalchemy>=1.4.0",
        # "pydantic>=1.8.0",
        # "nltk>=3.6.0",
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