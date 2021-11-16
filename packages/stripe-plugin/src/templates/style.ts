export const styleTemplate = `
    body{
        font-family: 'Open Sans';
        background-color:{{Colors.background}};
        color:##Colors.text##;
    }
    #loading_container{
        background-color:rgba(255,255,255,0.6);
        color:{{Colors.info}};
        position: fixed;
        left:0px;
        right:0px;
        top:0px;
        bottom:0px;
        z-index:1000;
        font-size:128px;
    }
    #loading{
        position: absolute;
        left:50%;
        top:50%;
        transform:translate(-50%,-50%)
    }            
    #card-element{
        padding : 20px;
        border : 1px solid rgb(185, 185, 185);
        border-radius: 5px;
        background-color : #fff;
        box-shadow : 0px 5px 16px -2px rgba(0,0,0,0.25);
    }
    #logo-image{
        width: 200px;
        margin-bottom: 20px;
    }
    #logo-image-holder{
        text-align : center;
    }
    #logo-icon{
        font-size : 72px;
        text-align : center;
        margin-bottom : 20px;
        margin-top : 20px
    }            
    #card-container{
        margin-top : 20px
    }            
    #card-submit{
        margin-top: 20px;
        text-align: center;
        padding: 20px;
        color: #fff;
        background-color: #044f26;
        box-shadow: 0px 5px 16px -2px rgba(0,0,0,0.25);
        border-radius: 5px;
    }            
    #card-errors{
        background-color: #ff3f34,
        color : #fff,
        padding : 20px,
        border-radius : 5px,
        margin-top : 20px,
        display : none
    }
    #payment-amount-container{
        font-size : 48px,
        text-align : center,
        margin-bottom : 20px,
        color : #054f26

    }
    #payment-amount-description-container{
        text-align : center;
        font-size : 24px;
    }    
    #setup_description{
        text-align : center;
        margin-bottom : 20px;
    }

    #success{
        position: fixed;
        left:50%;
        top:50%;
        transform: translate(-50%,-50%);
        font-size:128px;
        color:##Colors.success##;
        text-align:center
        
    }
    #sucess_message{
        color:##Colors.text##;
        font-size:20px;
        margin-top:10px;
    }

`;
