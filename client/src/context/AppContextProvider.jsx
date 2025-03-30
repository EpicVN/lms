import { AppContext } from "./AppContext";

export const AppContextProvider = (props) => {
    const value = {

    }
    
    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}