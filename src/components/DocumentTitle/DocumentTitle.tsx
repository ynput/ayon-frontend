import { Helmet } from "react-helmet";
import { useEffect } from "react";

type DocumentProps = {
    title: string,
}

const DocumentTitle = ({ title }: DocumentProps) => {
    // Force update document.title as backup in case Helmet fails
    useEffect(() => {
        if (title && title !== document.title) {
            document.title = title;
        }
    }, [title]);

    return (
        <Helmet defer={false}>
            <title>{title}</title>
        </Helmet>
    )
}


export default DocumentTitle
