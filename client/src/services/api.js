const API_BASE_URL = "http://localhost:3000/api/trips"

const handleResponse = async (response) => {
    if (!response.ok) {
    const contentType = response.headers.get('content-type')
    let errorMessage = 'API request failed'

    if (contentType?.includes('application/json')) {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
    } else {
        errorMessage = await response.text()
    }

        throw new Error(errorMessage)
    }
    return response.json()
}

export const tripsApi = {
    getYearlySummary: () => 
        fetch(`${API_BASE_URL}/summary/yearly`).then(handleResponse)
}

