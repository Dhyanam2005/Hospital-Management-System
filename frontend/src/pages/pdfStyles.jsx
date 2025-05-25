import { StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
    centeredText : {
        textAlign: "center",
    },
    boldText : {
        fontWeight: "bold",
        fontSize : 20
    },
    marginTopHeading : {
        marginTop : 20,
    },
    line : {
        borderBottomWidth : 1,
        borderBottomColor : "#000",
        marginVertical : 50,
        width: "80%" ,
        alignSelf: "center"
    },
    patDetailsSections : {
        marginTop : 20,
        marginBottom : 20,
    },
    patDetailsSectionsRow : {
        marginBottom: 4,
        display: "flex",
        flexDirection: "row"
    },
    patDetailsSectionsLabel : {
        fontWeight : "bold",
    },
    patDetailsSectionsValue : {
        paddingLeft: 10
    },

})

export default styles;