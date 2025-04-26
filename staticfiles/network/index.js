
const stateManager = (function() {
        const state ={
            auth_user_data:{},
            isInOwnProfile: null,
            page_type:"home-page",
            auth_id : null,
            profile_info:{
                profile_user: {},
                follow_state: false,
                follower_list: [],
                following_list: []
            },
            pagination:{
                total_page: 0,
                current_page: 1,
            },
            isEditing: false,
        }

        return {
            newInit(initial_state = {}){
                Object.assign(state, initial_state);
                console.log("StateManager initialized:", state);
            },

            set_authInfo(data){
                state.auth_user_data = data
                console.log("StateManager Changed:auth_user_data", data)
            },
            get_authId(){
                return state.auth_id
            }, 
            get_profile_image(){
                return state.auth_user_data
            },

            //post接口
            set_pageType(data){
                state.page_type = data
                console.log("StateManager Changed:page_type", data)
            },
            get_pageType(){
                return state.page_type
            },

            //profile接口
            set_profileInfo(data){
                state.profile_info = {
                    profile_user:data.profile_user,
                    follow_state:data.follow_state,
                    follower_list: data.follower_list,
                    following_list: data.following_list
                }
                console.log("StateManager Changed:profile_info", state.profile_info);
            }, 
            get_profileUser(){
                return state.profile_info.profile_user
            },
            get_profileId(){
                return state.profile_info.profile_user.id
            },
            get_isFollow(){
                return state.profile_info.follow_state
            },
            get_followData(){
                return state.profile_info.follower_list
            },
            get_followingData(){
                return state.profile_info.following_list
            },

            //Pagination接口
            set_pagination(data){
                state.pagination = {
                    total_page:data.total_page,
                    current_page:data.current_page
                }
            },
            get_totalPostPage(){
                return state.pagination.total_page
            },
            get_currentPostPage(){
                return state.pagination.current_page 
            },

            set_isEditing(data){
                state.isEditing = data
            },
            get_isEditing(){
                return state.isEditing
            },
            exit_Editing(force = false){
                if (state.isEditing && !force){
                    const shouldExit = confirm("You are editing the post! Would you want to leave?")
                    if (!shouldExit) return false;
                }
                state.isEditing = false
                return true
            },
            
            currentPageIsProfile(){
                return document.querySelector('#profile-page').style.display === "block";
            }
        }
    })()

//DOM
document.addEventListener("DOMContentLoaded", function () {

    
    stateManager.newInit({ 
        auth_id:currentUser,
        auth_user_data:auth_user_data
    } )

    console.log(currentUserData)
    auth_id = stateManager.get_authId()
    PageManager.load_page("home-page")

    document.querySelectorAll('#home').forEach(btn => {
        btn.onclick = () => PageManager.load_page("home-page");
    });
    document.querySelectorAll('#profile').forEach(btn => {
        btn.onclick = () => PageManager.load_page("profile-page", auth_id);
    });
    document.querySelectorAll('#following_posts').forEach(btn => {
        btn.onclick = () => PageManager.load_page("following-posts-page");
    });
    
    document.addEventListener('click', (event) =>{
        console.log("Clicked:", event.target);  
        if(event.target.classList.contains('profile-button')){
            document.querySelector('#modal-layer').innerHTML=''
            PageManager.load_page('profile-page',event.target.dataset.user)
        }
    })

    if(stateManager.get_authId() != "None"){
        const postButton = document.querySelector('#post-btn')
        postButton.onclick = () => PostModalManger.init()
    
        const postSection = document.querySelector('#compose-content')
        postSection.onclick = () => PostModalManger.init()
    }
   

    document.querySelector('#posts').addEventListener('click',(event) =>{
        const post_item = event.target.closest('.post-item')
        if(!post_item) return;
    
        if(event.target.closest('#like-btn')){
            const post_id = parseInt(post_item.dataset.id)
            LikePostManager.toggle_like(post_id, post_item)}
        

        if(event.target.closest('#edit-btn')){
            const post_id = parseInt(post_item.dataset.id)
            const content = post_item.querySelector('#post-content').innerText.trim()
            const poster_id = parseInt(post_item.dataset.posterId)
            const poser_name = post_item.querySelector('.poster-name').innerText
            if (poster_id == auth_id){
                let post = {
                    id:post_id,
                    poster_id:poster_id,
                    content:content,
                    poster_name:poser_name
                }
                EditPostManager.init(post, post_item)
            }
        }
    })

}, false);




// Page Modules
const PageManager = {
    load_page(view, user_id = null){
        stateManager.set_pageType(view)
        if (!stateManager.exit_Editing(true)) return;
        if(stateManager.get_authId()!= "None") {
            this.compose_section(user_id)
        }
        this.home_or_profile(view, 'block')
        this.updateNavIcons()

        if(view == "profile-page" && user_id != auth_id){
            ProfileManager.load_profile(user_id)
            .then(()=>{
                PostManager.load_post(1, user_id)
                this.pageName()
                this.updateNavIcons()
            })
        } else if (view == "profile-page"){
            ProfileManager.load_profile(auth_id)
            .then(()=>{
                PostManager.load_post(1, auth_id)
                this.pageName()
                this.updateNavIcons()

            }) 
        } else {
            PostManager.load_post(1) 
            this.pageName()
        }


    },
    //Helper function: control to show the section or not
    compose_section(user_id){
        const compost_section = document.querySelector('#compose-post')
        const img = compost_section.querySelector('.profile_image')
        img.src = stateManager.get_profile_image().profile_image
        page_type = stateManager.get_pageType()
        if (page_type == "profile-page" && user_id != auth_id ){
            compost_section.classList.add('hidden') 
        } else{
            document.querySelector('#compose-content').value = ""
            if (compost_section.classList.contains('hidden')){
                compost_section.classList.remove('hidden')
            }
        }
    },
    home_or_profile(view, displayType ='block'){
        const pages = ['home-page','profile-page'];
        pages.forEach(page =>{
            document.querySelector(`#${page}`).style.display = page === view ? displayType: 'none'
        })
    },
    pageName(){
        const pageNames =  document.querySelectorAll('.pageName')
        page_type = stateManager.get_pageType()


        if(stateManager.get_authId() == "None"){
            const path = window.location.pathname;
            if (path === '/register') {
                pageNames.forEach(node => {
                    node.innerText = "Register"
                })
            } else if (path === '/login') {
                pageNames.forEach(node => {
                    node.innerText = "Login"
                })
            }
        }

        console.log(`Current Page: ${page_type}`)
        if (page_type == 'home-page'){
            pageNames.forEach(node => {
                node.innerText = "Home"
            }
        )}else if (page_type == "following-posts-page"){
            pageNames.forEach(node => {
                node.innerText = "Following"
            })
         
        } else{
            const profile = stateManager.get_profileUser()
            profile_user = profile.user
            profile_id = profile.id
            if(profile_id == stateManager.get_authId()){
                pageNames.forEach(node => {
                    node.innerText = "Profile"
                })
            }else{
                pageNames.forEach(node => {
                    node.innerText = `${profile_user}`
                })
            }
        }
    },
    updateNavIcons(){
        page_type = stateManager.get_pageType()
       
        const iconMap = {
            'home-page': 'home',
            'profile-page': 'profile',
            'following-posts-page': 'following',
        }
        const currentIconKey = iconMap[page_type]

        //initialize
        Object.values(iconMap).forEach(iconKey => {
            const activeIcons = document.querySelectorAll(`.in-${iconKey}-icon`)
            const unactiveIcons = document.querySelectorAll(`.out-${iconKey}-icon`)

            const isCurrent = iconKey == currentIconKey

            activeIcons.forEach(icon => {
                icon.classList.toggle('hidden', !isCurrent)
            })
            unactiveIcons.forEach(icon => {
                icon.classList.toggle('hidden', isCurrent)
            })
        })
    }

}




//Post Modules
const PostService = {
    async fetch_post(page = 1, user_id =null , page_type = "home-page"){
        const response = await fetch(`/api/posts/?page=${page}&user_id=${user_id || ""}&page_type=${page_type}`);
        return handleResponse(response);
    }
}

const PostManager ={
    load_post(page = 1, user_id = null){
        const page_type = stateManager.get_pageType()
        console.log(page_type)
        PostService.fetch_post(page, user_id, page_type)
        .then(response => { 
            console.log(response)

            PaginationManager.init(response.data, user_id)
            this.render_post(response.data.posts)
            showMessage(response.message)
            ;
        })
        .catch(error => {
            console.error("Error loading post:", error);
            showMessage(error)
        })
    },
    render_post(posts){
        const postList = document.querySelector('#posts');
        postList.innerHTML = "";
        posts.forEach(post => {
            const post_item = PostView.postItem(post)
            postList.appendChild(post_item);
        })
    }
}

const PostView = {
    postItem(post){
        const item = document.createElement('div');
        item.className = 'post-item';
        item.id = `post-${post.id}`;
        item.dataset.id = post.id;
        item.dataset.posterId = post.poster_id
        item.innerHTML = this.postTemplate(post)
        if (post.poster_id == auth_id){
            item.querySelector('#edit-btn').classList.remove('hidden')
        }
        LikePostView.buttonView(post, item)
        return item
    },
    postTemplate(post) {
        return`
            <div class="flex w-full h-full my-2 px-2  ">
                <div class="flex flex-col w-10 h-full pt-[5px]">
                    <img class=" profile-button cursor-pointer w-8 h-8 rounded-full border-[0.2px]  object-cover" src="${post.profile_image}" data-user=${post.poster_id} alt="profile-picture">
                </div>
                <div class ="w-full h-full">
                    <div id="post-info" class="flex items-center my-2">
                        <div class="w-full flex items-center">
                            <div class="poster-name m-1 font-bold">${post.poster}</div>
                            <div class="m-1 text-sm text-gray-500" title="${post.timestamp}">${formatTime(post.created_time)}</div>
                        </div>
                        <div id="edit-btn" class="m-1 w-auto hidden hover:scale-90 hover:rounded-lg p-1 hover:bg-stone-200">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-[20px] h-[20px]" viewBox="0 -960 960 960" fill="#434343"><path d="M180-180h44l472-471-44-44-472 471v44Zm-30 60q-13 0-21.5-8.5T120-150v-73q0-12 5-23.5t13-19.5l557-556q8-8 19-12.5t23-4.5q11 0 22 4.5t20 12.5l44 44q9 9 13 20t4 22q0 11-4.5 22.5T823-694L266-138q-8 8-19.5 13t-23.5 5h-73Zm629-617-41-41 41 41Zm-105 64-22-22 44 44-22-22Z"/></svg>
                        </div>
                    </div>
                    <div id="post-content" class="my-2" >
                        <div class="m-1 pr-3 text-wrap whitespace-pre-line" style="white-space:pre-wrap">${post.content.replace(/\n/g, '<br>')}</div>
                    </div>
                    <div class="flex items-center w-full space-x-5 my-1">
                        <div id="like-btn" class="h-full flex space-x-1 items-center text-nowrap hover:bg-gray-300 rounded-3xl px-3 py-1">
                            <svg xmlns="http://www.w3.org/2000/svg" id="like" class="w-[20px] h-[20px]" viewBox="0 -960 960 960" fill="#434343"><path d="M480-140q-10.7 0-21.78-3.87-11.08-3.87-19.49-12.38L386-205Q262-320 171-424.5T80-643q0-90.15 60.5-150.58Q201-854 290-854q51 0 101 24.5t89 80.5q44-56 91-80.5t99-24.5q89 0 149.5 60.42Q880-733.15 880-643q0 114-91 218.5T574-205l-53 49q-8.25 8.38-19.12 12.19Q491-140 480-140Zm-26-543q-27-49-71-80t-93-31q-66 0-108 42.5t-42 108.93q0 57.57 38.88 121.22 38.88 63.66 93 123.5Q326-338 384-286.5q58 51.5 96 86.5 38-34 96-86t112-112.5q54-60.5 93-124.19T820-643q0-66-42.5-108.5T670-794q-50 0-93.5 30.5T504-683q-5 8-11 11.5t-14 3.5q-8 0-14.5-3.5T454-683Zm26 186Z"/></svg>
                            <svg xmlns="http://www.w3.org/2000/svg" id="unlike" class="w-[20px] h-[20px] hidden" viewBox="0 -960 960 960" fill="#EA3323"><path d="M480-140q-11 0-22-4t-19-12l-53-49Q262-320 171-424.5T80-643q0-90 60.5-150.5T290-854q51 0 101 24.5t89 80.5q44-56 91-80.5t99-24.5q89 0 149.5 60.5T880-643q0 114-91 218.5T574-205l-53 49q-8 8-19 12t-22 4Z"/></svg>
                            <div id="like-num" class="text-sm text-gray-500"> </div>
                        </div>
                        <div class="h-full flex space-x-1 items-center text-nowrap hover:bg-gray-300 rounded-3xl px-3 py-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-[20px] h-[20px]" viewBox="0 -960 960 960" fill="#434343"><path d="M140-240q-24 0-42-18t-18-42v-520q0-24 18-42t42-18h680q24 0 42 18t18 42v668q0 19.69-18.5 27.34Q843-117 829-131L720-240H140Zm606-60 74 80v-600H140v520h606Zm-606 0v-520 520Z"/></svg>
                            <div class="text-sm text-gray-500">20</div>
                        </div>
                        <div class="h-full flex space-x-1 items-center text-nowrap hover:bg-gray-300 rounded-3xl px-3 py-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-[20px] h-[20px]" viewBox="0 -960 960 960" fill="#434343"><path d="M686-80q-47.5 0-80.75-33.25T572-194q0-8 5-34L278-403q-16.28 17.34-37.64 27.17Q219-366 194-366q-47.5 0-80.75-33.25T80-480q0-47.5 33.25-80.75T194-594q24 0 45 9.3 21 9.29 37 25.7l301-173q-2-8-3.5-16.5T572-766q0-47.5 33.25-80.75T686-880q47.5 0 80.75 33.25T800-766q0 47.5-33.25 80.75T686-652q-23.27 0-43.64-9Q622-670 606-685L302-516q3 8 4.5 17.5t1.5 18q0 8.5-1 16t-3 15.5l303 173q16-15 36.09-23.5 20.1-8.5 43.07-8.5Q734-308 767-274.75T800-194q0 47.5-33.25 80.75T686-80Zm.04-60q22.96 0 38.46-15.54 15.5-15.53 15.5-38.5 0-22.96-15.54-38.46-15.53-15.5-38.5-15.5-22.96 0-38.46 15.54-15.5 15.53-15.5 38.5 0 22.96 15.54 38.46 15.53 15.5 38.5 15.5Zm-492-286q22.96 0 38.46-15.54 15.5-15.53 15.5-38.5 0-22.96-15.54-38.46-15.53-15.5-38.5-15.5-22.96 0-38.46 15.54-15.5 15.53-15.5 38.5 0 22.96 15.54 38.46 15.53 15.5 38.5 15.5Zm492-286q22.96 0 38.46-15.54 15.5-15.53 15.5-38.5 0-22.96-15.54-38.46-15.53-15.5-38.5-15.5-22.96 0-38.46 15.54-15.5 15.53-15.5 38.5 0 22.96 15.54 38.46 15.53 15.5 38.5 15.5ZM686-194ZM194-480Zm492-286Z"/></svg>
                            <div class="text-sm text-gray-500">5</div>
                        </div>
                    </div>
                </div>
                
            </div>
            <hr class="w-full">
       `
    },
}


const PostModalService = {
    async fetch_new_post(content){
        const response = await fetch("/api/new_post", {
            method: "POST",
            body: JSON.stringify({ content }),
        });
        return handleResponse(response);
    }
}

const PostModalManger = {
    init(){
        this.render_post_modal()
        this.close_modal_listener();
    },
    close_modal_listener(){
        const close_modal = document.querySelector('#modal-overlay')
        close_modal.onclick = (event) => {
            if (event.target === close_modal){
                document.querySelector('#modal-layer').innerHTML=``
            }
        };        
    },
    render_post_modal(){
        PostModalView.postModal()
        document.querySelector('#cancel_btn').onclick = () => document.querySelector('#modal-layer').innerHTML = ``
        setTimeout(() => {
            this.submit_post_listener();
        }, 0);
    },
    submit_post_listener(){
        const composeForm = document.querySelector('#new_post')
        composeForm.addEventListener('click', (event) => {
            event.preventDefault(); 
            const content = document.querySelector("#new_post_content").innerText.trim();
            this.new_post(content)
        })
    },
    async new_post(content){
        try {
            const result = await PostModalService.fetch_new_post(content)
            console.log("New Post:", result.message);
            const current_pageType = stateManager.get_pageType()
            if (current_pageType == "profile-page"){
                PageManager.load_page('profile-page',auth_id)
            } else {PageManager.load_page('home-page')}
            
            showMessage(result.message)
            document.querySelector('#modal-layer').innerHTML=``
        } catch (error) {
            console.error("Error submitting post:", error);
            showMessage(error)
        }
        
    }
}

const PostModalView = {
    postModal(){
        const modal = document.querySelector('#modal-layer')
        const user = currentUserData
        modal.innerHTML = this.postModalTemplate(user)
    },
    postModalTemplate(user){
        const profile_image = stateManager.get_profile_image().profile_image
        return `
            <div id="modal-overlay" class="absolute inset-0 z-10 bg-black/70 flex justify-center items-center">
                    <div class="post-modal-container z-20 absolute flex flex-col w-screen h-screen min-h-[250px] md:h-auto md:w-[550px] -bottom-0 md:static overflow-y-scroll">
                        <div class="relative modal_header w-full min-w-96 h-12 flex justify-center items-center border-b-[1px]">
                            <button id="cancel_btn" class="absolute left-5">Cancel</button>
                            <title class="flex w-full items-center justify-center font-bold">Post</title>
                        </div>
                        <div class="modal_content w-full h-auto min-h-[200px] min-w-96 px-4 pt-3"> 
                            <div class="w-full flex items-start space-x-3">
                                <div class="pt-2 min-w-[32px] min-h-[32px]">
                                    <img class=" profile-button cursor-pointer shrink-0 w-8 h-8 rounded-full object-cover" src="${profile_image}"  alt="profile-picture">
                                </div>
                                <div class="flex flex-col w-full max-h-[500px] items-start">
                                    <div class="flex w-full h-5 font-bold">${user}</div>
                                    <div id="new_post_content" 
                                        class="w-full h-auto text-sm max-h-[400px] min-h-[20px] overflow-y-auto pr-3
                                        select-text break-words whitespace-pre-wrap
                                        outline-none focus:ring-0 p-0"
                                        contenteditable="true"
                                        data-placeholder="What's new?"
                                        x-data="{ text: '' }"
                                        x-text="text"
                                        x-init="$watch('text', value => $el.innerText = value.trim())">
                                        <p><br></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="absolute bottom-2 modal_bottom w-full min-w-96 h-12 mt-4 pr-4 pb-4 flex md:static md:justify-end items-center">
                            <button id="new_post" class="absolute bottom-3 right-3 md:static btn px-3 w-auto shrink-0" type="submit">Post</button>
                        </div>
                    </div>
            </div> 
        `
    }
}

//EditPost Modules
const EditPostService = {
    async fetch_edit(post_id,poster_id,updated_content){
        const response = await fetch(`/api/posts/${post_id}/`, {
            method: 'PUT',
            body: JSON.stringify({
                content: updated_content,
                poster_id: poster_id,
            })
        });
        return handleResponse(response);
    },
}

const EditPostManager = {
    init(post, post_item){
        if(stateManager.get_isEditing()) {
            showMessage("Please complete the post first!")
            return;
        }
        stateManager.set_isEditing(true)

        EditPostView.editForm(post)
        this.close_edit(post, post_item)
        this.save_edit(post, post_item)
    },
    close_edit(post, post_item){
        const close_button = document.querySelector('#cancel_btn')
        
        const cancelEdit_handler = () => {
            confirmMessage((confirmed)=> {
                if(confirmed) {
                    document.querySelector('#modal-layer').innerHTML=''
                    EditPostView.postContent(post.content, post_item)
                    stateManager.set_isEditing(false) 
                    showMessage("Cancel edit successfully")
                }
            }) 
        }

        close_button.addEventListener('click',cancelEdit_handler)
    },
    save_edit(post,post_item){
        const save_button = document.querySelector('#save')

        const saveEdit_handler = () => {
            const updated_content= document.querySelector('#new_post_content').innerHTML.trim()
            const pureText = updated_content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();

            if (!pureText) {
                showMessage("Post content cannot be empty!");
                return;
            }


            EditPostService.fetch_edit(post.id, post.poster_id, updated_content)
            
            .then(response => {
                console.log(response);
                document.querySelector('#modal-layer').innerHTML=''
                EditPostView.postContent(response.data.updated_post.content, post_item)
                showMessage(response.message)
            })
            .then(stateManager.set_isEditing(false))
            .catch(error => {
                console.log("Error saving post:", error);
                showMessage(error)
            })
        }

        save_button.addEventListener('click',saveEdit_handler)
    },
}

const EditPostView = {
    editForm(post){
        const modal_layer = document.querySelector('#modal-layer')
        const profile_image = stateManager.get_profile_image().profile_image

        modal_layer.innerHTML = `
            <div id="modal-overlay" class="absolute inset-0 z-10 bg-black/70 flex justify-center items-center">
                    <div class="post-modal-container z-20 absolute flex flex-col w-screen h-screen min-h-[250px] md:h-auto md:w-[550px] -bottom-0 md:static overflow-y-scroll">
                        <div class="relative modal_header w-full min-w-96 h-12 flex justify-center items-center border-b-[1px]">
                            <button id="cancel_btn" class="absolute left-5 focus:ring-0 focus:outline-none focus:border-0">Cancel</button>
                            <title class="flex w-full items-center justify-center font-bold">Post</title>
                        </div>
                        <div class="modal_content w-full h-auto min-h-[200px] min-w-96 px-4 pt-3"> 
                            <div class="w-full flex items-start space-x-3">
                                <div class="pt-2 min-w-[32px] min-h-[32px]">
                                    <img class=" profile-button cursor-pointer shrink-0 w-8 h-8 rounded-full object-cover" src="${profile_image}"  alt="profile-picture">
                                </div>
                                <div class="flex flex-col w-full max-h-[500px] items-start">
                                    <div class="flex w-full h-5 font-bold">${post.poster_name}</div>
                                    <div id="new_post_content" 
                                        class="w-full h-auto text-sm max-h-[400px] min-h-[20px] overflow-y-auto pr-3
                                        select-text break-words whitespace-pre-wrap
                                        outline-none focus:ring-0 p-0"
                                        contenteditable="true"
                                        data-placeholder="What's new?"
                                        >${post.content.replace(/\n/g, "<br>")}</div>
                                </div>
                            </div>
                        </div>
                        <div class="absolute bottom-2 modal_bottom w-full min-w-96 h-12 mt-4 pr-4 pb-4 flex md:static md:justify-end items-center">
                            <button id="save" class="absolute bottom-3 right-3 md:static btn px-3 w-auto shrink-0" type="submit">Save</button>
                        </div>
                    </div>
            </div> 
        `
    },
    postContent(content, post_item){
        post_item.querySelector('#post-content').innerHTML = `
            <div class="m-1 text-wrap whitespace-pre-line">${content.replace(/\n/g, '<br>')}</div>
        `  
    }
}



//LikePost Modules
const LikePostService = {
    async fetch_like(post_id){
        const response = await fetch(`/api/posts/${post_id}/like/`, {
            method: 'PUT',
            body: JSON.stringify({})
        });
        return handleResponse(response);
    }
}

const LikePostManager = {
    toggle_like(post_id, post_item){
        LikePostService.fetch_like(post_id)
        .then (response => {
            console.log(response)
            LikePostView.buttonView(response.data.post, post_item)
            showMessage(response.message)
        })
        .catch(error => {
            console.log("Error liking post:", error)
            showMessage(error)
        })
    },
}

const LikePostView ={
    buttonView(data, post_item){
        const like = post_item.querySelector('#like');
        const unlike = post_item.querySelector('#unlike');
        const like_num = post_item.querySelector('#like-num');

        like.classList.toggle('hidden', data.is_like);
        unlike.classList.toggle('hidden', !data.is_like);
        like_num.classList.toggle('text-gray-500', !data.is_like);
        like_num.classList.toggle('text-red-500', data.is_like)
        
        like_num.textContent = data.likes_count
   } 
}



//Pagination Modules
const PaginationService = {
    page_state(data){
        stateManager.set_pagination(data)
        document.querySelector('#page-number').textContent = stateManager.get_totalPostPage();
        document.querySelector('#current-page').textContent = stateManager.get_currentPostPage();
    }
}

const PaginationManager = {
    init(data, user_id = null){
        PaginationService.page_state(data)
        if (!stateManager.exit_Editing(true)) return;

        const {prev_button, next_button} = PaginationView.paginationButton(data)
        const current_post_page = stateManager.get_currentPostPage()
       
        document.querySelectorAll('#profile').forEach(btn => {
            btn.onclick = () => PageManager.load_page("profile-page", auth_id);
        });

        prev_button.onclick = () => PostManager.load_post(current_post_page-1,user_id);
        next_button.onclick = () => PostManager.load_post(current_post_page+1,user_id);
    }, 
}

const PaginationView = {
    paginationButton(data){

        const prev_button = document.querySelector('#button-previous');
        const next_button = document.querySelector('#button-next');
        
        prev_button.style.display = data.has_previous ? 'block' : 'none';
        next_button.style.display = data.has_next ? 'block' : 'none';
        
        return {prev_button, next_button};
    }
}



//Profile Modules
const ProfileService = {
    async fetch_profile(user_id){
        const response = await fetch(`/api/users/${user_id}/`);
        return handleResponse(response);
    }
}

const ProfileManager ={
    load_profile(user_id){      
        ProfileService.fetch_profile(user_id)
        return ProfileService.fetch_profile(user_id)
        .then(response => {
            console.log(response)
            stateManager.set_profileInfo(response.data)
            ProfileView.profileSection(response.data)
            if (user_id == auth_id) {
                this.hidden_follow_section()
                const imageModal = document.querySelector('.change_profile_image')
                imageModal.onclick = () => imageModalManager.init()
            } else {
                this.show_follow_section()
            }
            FollowButtonManager.init_follow_button()
            this.init_follow_list('follower')
            this.init_follow_list('following')
        })
        .catch(error => {
            console.log("Error loading profile:", error)
            showMessage(error)
        })
    },
    init_follow_list(selector){
        const list_button = document.querySelector(`#${selector}`);
        list_button.onclick = () => FollowModalManager.init(selector)
    },
    show_follow_section(){
        const follow_section = document.querySelector('#follow-section')
        if (follow_section.classList.contains('hidden')){
            follow_section.classList.remove('hidden')
        } 
    },
    hidden_follow_section(){
        const follow_section = document.querySelector('#follow-section')
        follow_section.classList.add('hidden')
    },
 
}

const ProfileView = {
    profileSection(data){
        profile_info = document.querySelector('#profile-page')
        profile_info.innerHTML = this.profileTemplate(data.profile_user)
    },
    profileTemplate(data){
        const profile_image = stateManager.get_profileUser().profile_image
        return`
        <div class="profile w-full h-full flex flex-1 flex-col justify-center space-y-5 mt-2">
            <div class="profile_info_section w-full">
                
                <div id="user-info" class="user_info_section w-full p-2">
                    <div class="info_container flex justify-between" >
                            <div class="username_box">
                                <div id="username" class="text-2xl font-bold" data-user-id="${data.id}">${data.user}</div>
                                <div id="user_email">${data.email}</div>
                            </div>
                        <div class="image_box">
                            <img class=" change_profile_image w-14 h-14 rounded-full border-[0.2px] border-gray-300  object-cover" src="${profile_image}" alt="profile-picture"> 
                        </div>
                    </div>
                </div>

                <div class="user_follow_data_section w-full pt-4">
                    <div class="follow_data_container flex justify-between items-center px-4">
                        <div id="follower" class="num hover:underline">
                            <span id="followers-count">${data.followers_count}</span> <span>followers</span>
                        </div>
                        <div id="following" class="num hover:underline">
                            <span id="following-count">${data.following_count}</span> <span>follow</span>
                        </div>
                        <div id= "post-counts" class="num">${data.posts_count} <span>posts</span> </div>
                    </div>
                </div>    

            </div>
            <div id="follow-section" class="w-full">
                <button id="follow-button" class="follow-btn"></button>
            </div>
            <hr class="w-full">
        </div>
        `
    },
    
}

const imageModalService = {
    async fetch_profile_image(user_id, image){
        const formData =new FormData()
        formData.append("image",image)
        const response = await fetch(`/api/users/${user_id}/new_profile_image`, {
            method: "POST",
            body: formData
        });
        return handleResponse(response);
    }
  
}

const imageModalManager = {
    init(){
        this.open_profile_image()
        this.close_modal_listener()
    },
    open_profile_image(){
        modal = document.querySelector('#modal-layer') 
        modal.innerHTML= imageModalView.imageModal()

        setTimeout(() => {
            this.choose_local_file()
        })
    },
    close_modal_listener(){
        const close_modal = document.querySelector('#modal-overlay')
        close_modal.onclick = (event) => {
            if (event.target === close_modal){
                document.querySelector('#modal-layer').innerHTML=``
            }
        };
        const modal_container = document.querySelector('.image-modal-container')
        cancel_btn = modal_container.querySelector('#cancel_btn')
        cancel_btn.onclick = () => document.querySelector('#modal-layer').innerHTML=``
    },
    choose_local_file(){
        const choose_btn = document.querySelector('#choose_profile_image')
        const localFileView = document.querySelector('#upload-profile-image')
        choose_btn.onclick = () => localFileView.click()

        document.querySelector('#upload-profile-image').addEventListener('change', (e) => {
            const file = e.target.files[0]
            if (file) {
                const preview = document.querySelector('.preview-image')
                preview.src = URL.createObjectURL(file)
                this.upload_profileImage()
            }
        })
    },
    upload_profileImage(){

        const SaveImage = document.querySelector('#new_profile_image')
        SaveImage.disabled = false 
        SaveImage.classList.toggle('cursor-not-allowed',SaveImage.disabled)
        SaveImage.classList.toggle('cursor-pointer',!SaveImage.disabled)

        const fileInput = document.querySelector('#upload-profile-image')
        const file = fileInput.files[0]
        
        if(!file) {
            showMessage("Please choose a photo")
            return
        }
        SaveImage.onclick = () => {
            imageModalService.fetch_profile_image(auth_id,file)
            .then(response => {
                console.log("Success to update", response)
                showMessage("Profile image updated")
                stateManager.set_authInfo(response.data.profile_image)
                document.querySelector('#modal-layer').innerHTML=''
                PageManager.load_page('profile-page',auth_id)
            })
            .catch(err => {
                console.log("Failed to update",err)
                showMessage("Failed to update, Please try again")
            })
        }


    }
}

const imageModalView = {
    imageModal(){
        const profile_image = stateManager.get_profile_image().profile_image
        return `
        <div id="modal-overlay" class="absolute inset-0 z-10 bg-black/70 flex justify-center items-center">
            <div class="image-modal-container z-20 absolute flex flex-col w-screen h-screen min-h-[250px] md:h-auto md:w-[550px] -bottom-0 md:static overflow-y-scroll">
                <div class="relative modal_header w-full min-w-96 h-12 flex justify-center items-center border-b-[1px]">
                    <button id="cancel_btn" class="absolute left-5">Cancel</button>
                </div>
                <div class="modal_content w-full h-auto min-h-[200px] min-w-96 px-4 pt-3"> 
                    <div class="w-full h-full flex items-start justify-center">
                        <img class=" preview-image shrink-0 w-96 h-96 rounded-full object-cover" src="${profile_image}"  alt="profile-picture">
                        <input id="upload-profile-image" type="file" accept="image/*" hidden>
                    </div>
                </div>
                <div class="absolute bottom-2 modal_bottom w-full min-w-96 h-12 mt-4 pr-4 pb-4 flex md:static md:justify-end  md:space-x-3 items-center">
                    <button id="choose_profile_image" class="absolute bottom-3 left-3 md:static btn px-3 w-auto shrink-0" type="submit">Choose File</button>
                    <button id="new_profile_image" class=" absolute bottom-3 right-3 md:static btn px-3 w-auto shrink-0 cursor-not-allowed " type="submit" disabled >Save</button>
                </div>
            </div>
        </div>  
        ` 
    }
}


//Follow Button Modules
const FollowButtonService = {
    async toggle_follow(user_id, follow_state){
        const response = await fetch(`/api/users/${user_id}/follow/`, {
            method: 'PUT',
            body: JSON.stringify({ follow_state: follow_state })
        });
        return handleResponse(response);
    },
}

const FollowButtonManager ={
    init_follow_button(){
        const follow_state= stateManager.get_isFollow()
        const target_id = stateManager.get_profileId()

        const follow_button = FollowButtonView.followButton(follow_state)
        follow_button.onclick = () => {
            FollowButtonService.toggle_follow(target_id,!follow_state)
            .then(response => {
                console.log(response);
                FollowButtonView.followNumber(response.data.profile_user)
                stateManager.set_profileInfo(response.data)
                this.init_follow_button()
                showMessage(response.message)
            })
            .catch(error =>{
                console.log("Error following user:", error)
                showMessage(error)
            })
        }
    },
}

const FollowButtonView ={
    followButton(follow_state){
        const follow_button = document.querySelector('#follow-button')
        follow_button.textContent = follow_state ? "Following" : "Follow"

        follow_button.classList.toggle('text-white',follow_button.textContent == "Follow")
        follow_button.classList.toggle('bg-black', follow_button.textContent == "Follow")
        follow_button.classList.toggle('text-black',follow_button.textContent == "Following")
        follow_button.classList.toggle('bg-white',follow_button.textContent == "Following")
        return follow_button
    },
    followNumber(data){
        document.querySelector('#followers-count').textContent = data.followers_count
        document.querySelector('#following-count').textContent = data.following_count 
    }
}



//Follow Modal Modules
const FollowModalService ={
    async fetch_profile(user_id) {
        const response = await fetch(`/api/users/${user_id}/`);
        return handleResponse(response);
    },
    async toggle_follow(user_id, follow_state){
        const response = await fetch(`/api/users/${user_id}/follow/`, {
            method: 'PUT',
            body: JSON.stringify({ follow_state: follow_state })
        });
        return handleResponse(response);
    },
}

const FollowModalManager ={
    init(selector){
        this.render_follow_modal(selector)
        this.bind_modal_events(selector)
    },
    bind_modal_events(selector){
        this.modal_follow_button_listener();
        this.switch_modal_listener(selector);
        this.close_modal_listener();
    },
    render_follow_modal(selector){
        profile_user = stateManager.get_profileUser()
        FollowModalView.modal(profile_user)
       
        if(selector == "follower"){
            list = stateManager.get_followData()
        } else if (selector == "following"){
            list = stateManager.get_followingData()
        }
        FollowModalView.followList(list,selector) 
    },
    modal_follow_button_listener(){
        const modalContent = document.querySelector('#modal-content')
        modalContent.addEventListener('click', async (event) => {
            const modal_follow_button = event.target.closest('.modal-follow-btn');
            if (!modal_follow_button) return;
        
            const target_id = parseInt(modal_follow_button.id.replace('modal-follow-button-',''))
            const followState = modal_follow_button.textContent === "Following";
            
            await this.modal_follow_button_handler(target_id, !followState); 
        });
    },
    async modal_follow_button_handler(target_id, follow_state){
        try{
            const response = await FollowModalService.toggle_follow(target_id,follow_state)
            FollowModalView.modal_followButtonView(response.data)
            showMessage(response.message)
            
            const profile_id = stateManager.get_profileId()
            const updatedProfile = await FollowModalService.fetch_profile(profile_id)
            stateManager.set_profileInfo(updatedProfile.data)

            // showMessage(updatedProfile.message)

        }catch(error){
            console.log("Error changing follow status:", error)
            showMessage(error)
        }
    },
    switch_modal_listener(selector){   
        switch_button = document.querySelector(selector == 'follower' ? '#modal-following' : '#modal-follower')
        switch_button.onclick = () => this.init(selector == 'follower'? 'following':'follower')
    },
    close_modal_listener(){
        const profile_id = stateManager.get_profileId()
        const close_modal = document.querySelector('#modal-overlay')
        close_modal.onclick = (event) => {
            if (event.target === close_modal){
                document.querySelector('#modal-layer').innerHTML=``
                if (profile_id == auth_id){
                    ProfileManager.load_profile(auth_id)
                }
            }
        };       
    }
}

const FollowModalView = {
    modal(profile_user){
        const follow_modal = document.querySelector('#modal-layer')
        follow_modal.innerHTML = this.modalView(profile_user) 
    },
    followList(list, selector){
        const list_container = document.querySelector(`#modal-${selector}`)
        list_container.classList.remove('border-gray-400','text-gray-400')
        list_container.classList.add('border-black','text-black')

        const follow_list = document.querySelector('#modal-content');
        follow_list.setAttribute('data-current-list', selector)
        follow_list.innerHTML=``;
        list.forEach(item => {
            const follow_item = document.createElement('div'); 
            follow_item.id = `follow-${item.id}`;
            follow_item.innerHTML = this.followListView(item); 
            follow_list.appendChild(follow_item);
            modal_follow_button = this.modal_followButtonView(item)
        })
    },
    modal_followButtonView(item){
        const modal_follow_button = document.querySelector(`#modal-follow-button-${item.id}`)

        if(item.id == auth_id){
            modal_follow_button.remove()
        }
        modal_follow_button.textContent = item.follow_state? "Following" : "Follow"

        modal_follow_button.classList.toggle('text-white',modal_follow_button.textContent == "Follow")
        modal_follow_button.classList.toggle('bg-black', modal_follow_button.textContent == "Follow")
        modal_follow_button.classList.toggle('text-gray-500',modal_follow_button.textContent == "Following")
        modal_follow_button.classList.toggle('bg-white',modal_follow_button.textContent == "Following")

        return modal_follow_button
    },
    modalView(user){
        return`
            <div id="modal-overlay" class="absolute inset-0 z-10 bg-black/70 flex justify-center items-center">
                <div id="modal" class="modal-container z-20 absolute flex flex-col w-screen h-[90%] -bottom-0 md:static md:w-[450px]  overflow-y-scroll">
                    
                    <div id="modal-header" class="w-full min-w-96 h-16 flex justify-center items-center space-x-[0.3px]">
                        <button id="modal-follower" class=" modal-btn flex-shrink-0 font-semibold w-[50%] h-full border-b-[1px] border-gray-400 text-gray-400 ">Followers
                            <div id="modal-follower-count" class="font-normal text-[12px]">${user.followers_count}</div>
                        </button>
                        <button id="modal-following" class="modal-btn flex-shrink-0 font-semibold w-[50%] h-full border-b-[1px] border-gray-400 text-gray-400 ">Following
                            <div id="modal-following-count" class="font-normal text-[12px]">${user.following_count}</div>
                        </button>
                    </div>
                    
                    <div id="modal-content" class="w-full min-w-96"> 
                    </div>

                </div>
            </div>
            
        `   
    },
    followListView(follow){
        return`
            <div id="modal-list-item" class="flex justify-between items-center h-20 px-4 overflow-x-scroll">
                <div id="modal-list-title" class="flex items-center min-w-56 space-x-4">
                    <img class=" profile-button cursor-pointer my-6 w-8 h-8 rounded-full border-[0.2px] border-gray-300 object-cover" src="${follow.profile_image}" data-user=${follow.id} alt="profile-picture">
                    <div id="modal-user_info">
                        <div id="modal-username" class="text-black " data-user-id="${follow.id}">${follow.user}</div>
                        <div id="modal-user_email" class="text-gray-400 font-light">${follow.email}</div>
                    </div>
                </div>
                <div id="modal-button" class="min-w-28">
                    <button id="modal-follow-button-${follow.id}" class="modal-follow-btn w-[100px] h-[40px]"></button>
                </div>
            </div>
        `
    },
}




//Helper function for handle api responses
async function handleResponse(response){
    if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "An unknown error occurred.")
    }
    return response.json();
}

function showMessage(messageText){
    const container = document.querySelector('#message')
    message = document.createElement('div')
    message.className = "message-box"
    message.classList.add('animate-fade-in')
    message.textContent = messageText

    container.innerHTML=''
    container.appendChild(message)

    setTimeout(() =>{
        message.classList.remove('animate-fade-in')
        message.classList.add('animate-fade-out')

        setTimeout(() => {
            message.remove()
        },200)
    },2000)
    
}

function confirmMessage(confirmed){
    const container = document.querySelector('#confirm-action')
    container.classList.add('animate-fade-in')
    container.innerHTML =`
         <div class="relative confirm-box h-full w-full">
            <div class="absolute top-0 bg-stone-600 w-full h-10 flex justify-center items-center rounded-t-md text-md text-white p-3 ">Cancel edit your post</div>
            <div id="confirm-message" class="absolute top-1/3 text-md text-wrap text-center px-4 ">Do you want to cancel, you would lose the change?</div>
            <div class="absolute top-2/3 flex justify-center space-x-10 mt-2">
                <button id="confirm-yes" class="px-4 py-2 w-24 bg-stone-200 text-stone-500 rounded focus:ring-0 focus:outline-none focus:border-0 hover:scale-90 transition-transform">Yes</button>
                <button id="confirm-no" class="px-4 py-2 w-24 bg-stone-500 text-stone-200 rounded focus:ring-0 focus:outline-none focus:border-0 hover:scale-90 transition-transform">No</button>
            </div>
        </div>
    `

    if(container.classList.contains('animate-fade-out'))
    container.classList.remove('animate-fade-out')

    const yesBtn = document.getElementById('confirm-yes');
    const noBtn = document.getElementById('confirm-no');
    
    yesBtn.onclick = () => {
        container.classList.remove('animate-fade-in')
        container.classList.add('animate-fade-out')
        confirmed(true)

        setTimeout(()=>{
            container.innerHTML=''
        },200)
    };

    noBtn.onclick = () => {
        container.classList.remove('animate-fade-in')
        container.classList.add('animate-fade-out')
        confirmed(false)
        
        setTimeout(()=>{
            container.innerHTML=''
        },200)
    };
}


//Helper function for formatting the post time like threads
function formatTime(timestamp){
    const now = new Date();
    const postTime = new Date(timestamp)

    const diffInSecond = Math.floor((now-postTime)/1000);
   
    const secondsInMinute = 60;
    const secondsInHour = 60 * 60;
    const secondsInDay = 24 * 60 * 60;
    const secondsInWeek = 7 * 24 * 60 * 60;
    const secondsInYear = 365 * 24 * 60 * 60;

    if (diffInSecond < secondsInMinute ){
        return `${diffInSecond}s`;
    }else if (diffInSecond < secondsInHour){
        const minute = Math.floor(diffInSecond/secondsInMinute);
        return `${minute}m`;
    }else if (diffInSecond < secondsInDay){
        const hour = Math.floor(diffInSecond/secondsInHour);
        return `${hour}h`;
    }else if (diffInSecond < secondsInWeek){
        const day = Math.floor(diffInSecond/secondsInDay);
        return `${day}d`;
    }else if (diffInSecond < secondsInYear){
        const week = Math.floor(diffInSecond/secondsInWeek);
        return `${week}w`;
    }else {
        const year =Math.floor(diffInSecond/secondsInYear);
        return`${year}`
    }

}
