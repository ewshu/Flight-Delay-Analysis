import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from datetime import datetime
import json
import pandas as pd

MAJOR_AIRPORTS = {
    'ATL': 'Atlanta International',
    'LAX': 'Los Angeles International',
    'ORD': 'Chicago O\'Hare',
    'DFW': 'Dallas/Fort Worth',
    'DEN': 'Denver International',
    'JFK': 'New York JFK',
    'SFO': 'San Francisco International',
    'SEA': 'Seattle-Tacoma',
    'LAS': 'Las Vegas',
    'MCO': 'Orlando International',
    'MIA': 'Miami International',
    'CLT': 'Charlotte Douglas',
    'EWR': 'Newark Liberty',
    'PHX': 'Phoenix Sky Harbor',
    'IAH': 'Houston Bush'
}


def load_and_clean_data():
    df = pd.read_csv('/Users/eshwar/PycharmProjects/Flight-Delay-Analysis/frontend/public/flights_sample_3m.csv')
    df['FL_DATE'] = pd.to_datetime(df['FL_DATE'])
    df = df[df['FL_DATE'].dt.year != 2020]
    critical_columns = ['AIRLINE', 'DEP_DELAY', 'ARR_DELAY', 'CANCELLED']
    df = df.dropna(subset=critical_columns)
    return df


def analyze_airport_data(df, airport_code):
    airport_flights = df[(df['ORIGIN'] == airport_code) | (df['DEST'] == airport_code)]

    airline_analysis = airport_flights.groupby('AIRLINE').agg({
        'DEP_DELAY': ['mean', 'count'],
        'ARR_DELAY': 'mean',
        'CANCELLED': 'mean'
    }).reset_index()

    airline_analysis.columns = ['AIRLINE', 'AVG_DEP_DELAY', 'TOTAL_FLIGHTS', 'AVG_ARR_DELAY', 'CANCELLATION_RATE']

    monthly_analysis = airport_flights.copy()
    monthly_analysis['MONTH'] = monthly_analysis['FL_DATE'].dt.month
    monthly_data = monthly_analysis.groupby(['MONTH', 'AIRLINE']).agg({
        'DEP_DELAY': ['mean', 'count'],
        'CANCELLED': 'mean'
    }).reset_index()

    monthly_data.columns = ['MONTH', 'AIRLINE', 'AVG_DEP_DELAY', 'TOTAL_FLIGHTS', 'CANCELLATION_RATE']
    monthly_data = monthly_data[monthly_data['TOTAL_FLIGHTS'] >= 50]

    return {
        'airlinePerformance': airline_analysis.to_dict(orient='records'),
        'monthlyPerformance': monthly_data.to_dict(orient='records')
    }


def main():
    df = load_and_clean_data()

    airport_results = {}
    for code, name in MAJOR_AIRPORTS.items():
        airport_results[code] = {
            'name': name,
            **analyze_airport_data(df, code)
        }

    analysis_results = {
        'airports': airport_results,
        'airportList': [{'code': k, 'name': v} for k, v in MAJOR_AIRPORTS.items()]
    }

    with open('frontend/public/analysis_results.json', 'w') as f:
        json.dump(analysis_results, f)


if __name__ == "__main__":
    main()