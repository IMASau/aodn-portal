package au.org.emii.portal

class Motd {
    
    String motd         //message of the day
    String motdTitle
    
    static mapping = {
        sort "motdTitle"
	motd type:'text'
    }
     

    static constraints = {
    }
    
    String toString() {
        return "${motdTitle}"
    }
}
