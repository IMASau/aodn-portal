package au.org.emii.portal

class Menu {
    
    String title
    String json
    Boolean active 
    Date editDate 
    

    static constraints = {
        title(
            nullable:false,
            blank: false, 
            maxSize: 40, 
            unique:true
        )
        json()
    }
}
