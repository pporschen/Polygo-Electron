import React, { useState } from 'react'

const Sidebar = () => {

    const handleClick = () => {
        console.log('hey')
    }

    return (

        <div className='sidebar' >
            <form>
                <input type='text' id='adress-input' class='sidebar-field' placeholder='Address' />
                <input type='text' id='radius-input' class='sidebar-field' placeholder='Radius' />
                <input type='submit' id='button-input' value='Click' class='sidebar-field' />

            </form>
            <div onClick={handleClick}>TEST</div>

        </div>

    )




}

export default Sidebar;