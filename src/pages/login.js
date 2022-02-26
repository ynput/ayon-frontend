import { useEffect, useState, useRef, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { useFetch } from 'use-http'
import { toast } from 'react-toastify'

import { InputText, Password, Button } from '../components'

import OAuth2ProviderIcon from '../components/oauth2-provider-icon'


const constructOAuth2Url = (url, clientId, redirectUri, scope) => {
    const query = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: scope,
        response_type: 'code',
    })
    return `${url}?${query}`
}


const OAuth2Links = ({options}) => {
    return (
        <div 
            style={{ 
                display: "flex",
                flexDirection: "row",
                gap: 12,
                fontSize: "1.8em",
            }
        }>
            {options.map(({name, url}) => (
                <a href={url} key={name} title={name}>
                    <OAuth2ProviderIcon name={name} />
                </a>
            ))}

        </div>
    )
}



const LoginPage = () => {
    const dispatch = useDispatch()
    const [name, setName] = useState("")
    const [password, setPassword] = useState("")

    const loginRef = useRef(null)
    const passwordRef = useRef(null)
    const [loading, setLoading] = useState(true)


    // OAuth2 handler

    const oauthCallbackRequest = useFetch('/api/oauth2/login')


    useEffect(() => {
        if (window.location.pathname.startsWith("/login/")){
            // const error = new URLSearchParams(window.location.search).get('error')
            const oprov = window.location.pathname.split("/")[2]
            const ocode = new URLSearchParams(window.location.search).get('code')

            if (oprov && ocode) {
                // we have a provider and a code
                // so we can request an access token

                const doOauthLogin = async (provider, code) => {
                    const data = await oauthCallbackRequest.get(`/${provider}?code=${code}&redirect_uri=${window.location.origin}/login/${provider}`)
                    if (data.user){
                        // login successful
                        toast.info(data.detail)
                        dispatch({
                            type: 'LOGIN', 
                            user: data.user, 
                            accessToken: data.token
                        })
                    } else {
                        // failed, so back on login page
                        setLoading(false)
                    }
                }

                setLoading(true)
                doOauthLogin(oprov, ocode)
            }
        } else {
            setLoading(false)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])



    // Login form    


    const loginRequest = useFetch("/api/auth/login", {data: {}})
    const oauthOptionsRequest = useFetch("/api/oauth2/options", [])


    const onLoginKeyDown = (event) => {
        if (event.key === 'Enter') {
            loginRequest.post({name, password})
        }
    }


    useEffect(()=>{
        if (loginRef.current)
            loginRef.current.focus()
    }, [loginRef])


    useEffect(()=>{
        if (loginRequest.error)
            toast.error("Unable to login")
    }, [loginRequest.error])


    useEffect(()=>{
        if (loginRequest.data.user){
            toast.info(loginRequest.data.detail)
            dispatch({
                type: 'LOGIN', 
                user: loginRequest.data.user, 
                accessToken: loginRequest.data.token
            })
        }
    }, [loginRequest.data, dispatch])


    const oauthOptions = useMemo( () => {
        if (!oauthOptionsRequest.data)
            return null
        if (!oauthOptionsRequest.data.options)
            return null
        if (!oauthOptionsRequest.data.options.length)
            return null
        let result = []
        for (const option of oauthOptionsRequest.data.options){
            const redirectUri = `${window.location.origin}/login/${option.name}`
            result.push({
                name: option.name,
                url: constructOAuth2Url(option.url, option.client_id, redirectUri, option.scope),
            })
        }
        return result

    }, [oauthOptionsRequest.data])

    
    if (loading)
        return <div>Loading...</div>


    return (
        <main className="center" style={{ flexDirection: "column"}}>
            <h1>OpenPype server</h1>
            <section>
                <InputText 
                    ref={loginRef}
                    placeholder="Username" 
                    aria-label="Username" 
                    required 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={onLoginKeyDown}
                />
                <Password 
                    ref={passwordRef}
                    placeholder="Password" 
                    feedback={false}
                    aria-label="Password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={onLoginKeyDown}
                />
                <Button 
                    label="Login" 
                    onClick={() => {
                        loginRequest.post({name, password})
                    }} 
                />
            </section>
            {oauthOptions && <OAuth2Links options={oauthOptions} />}
        </main>
    )
}

export default LoginPage