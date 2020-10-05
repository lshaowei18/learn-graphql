import React from 'react'
import axios from 'axios'

require('dotenv').config()

const TITLE = 'React Graphql Github Client'

const GITHUB_AXIOS_CLIENT = axios.create({
  baseURL: 'https://api.github.com/graphql',
  headers: {
    Authorization: `bearer ${process.env.REACT_APP_GITHUB_TOKEN}`
  }
})

const fetchDataFromGithub = async (url) => {
  console.log( await GITHUB_AXIOS_CLIENT.post('', {}))
}

// Get token from env var and create axios client
// Create react component
// Make graphql call
const App = () => {
  const onSubmit = async (event) => {
    event.preventDefault()
    await fetchDataFromGithub('hi')
    console.log("submitted!")
  }
  return (
    <div>
      <h1>{TITLE}</h1>
      <form onSubmit={onSubmit}>
        <label htmlFor="urlInput">https://github.com/</label>
        <input id="urlInput" type="text"/>
        <input type="submit" value="Submit"/>
      </form>
    </div>
  )
}

export default App