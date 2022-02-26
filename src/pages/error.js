
const Error = ({code, message, links}) => {
    return (
        <main className="center">
            <h1>ERROR {code}</h1>
            {message && <h2>{message}</h2>}
            {links && links.map((link, idx) => {
                return (
                    <></>                
                )
            })}
        </main>
    )
}

export default Error