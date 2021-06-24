from setuptools import setup

setup(
    name='gocompass',
    packages=['gocompass'],
    include_package_data=True,
    install_requires=[
        'flask',
    ],
    package_data={'gocompass': ['go-basic.obo','data/scoelicolor.txt', 'data/scoelicolor/*']},
)