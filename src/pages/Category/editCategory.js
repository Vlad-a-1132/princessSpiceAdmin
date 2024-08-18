import React from 'react';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import HomeIcon from '@mui/icons-material/Home';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { emphasize, styled } from '@mui/material/styles';
import Chip from '@mui/material/Chip';
import { useContext, useEffect, useState } from 'react';
import { FaCloudUploadAlt } from "react-icons/fa";
import Button from '@mui/material/Button';
import { deleteData, deleteImages, editData, fetchDataFromApi, postData, uploadImage } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { FaRegImages } from "react-icons/fa";
import { MyContext } from '../../App';
import { useParams } from 'react-router-dom';


import CircularProgress from '@mui/material/CircularProgress';
import { IoCloseSharp } from "react-icons/io5";

import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

//breadcrumb code
const StyledBreadcrumb = styled(Chip)(({ theme }) => {
    const backgroundColor =
        theme.palette.mode === 'light'
        ? theme.palette.grey[100]
        : theme.palette.grey[800];
    return {
        backgroundColor,
        height: theme.spacing(3),
        color: theme.palette.text.primary,
        fontWeight: theme.typography.fontWeightRegular,
        '&:hover, &:focus': {
            backgroundColor: emphasize(backgroundColor, 0.06),
        },
        '&:active': {
            boxShadow: theme.shadows[1],
            backgroundColor: emphasize(backgroundColor, 0.12),
        },
    };
});

const EditCategory = () => {

    const [isLoading, setIsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formFields, setFormFields] = useState({
        name: '',
        images: [],
        color: ''
    });

    const [previews, setPreviews] = useState([]);
    const [uploadedImageIds, setUploadedImageIds] = useState([]);

    const [category, setcategory] = useState([]);

    let { id } = useParams();

    const formdata = new FormData();

    const history = useNavigate();

    const context = useContext(MyContext);


    useEffect(() => {
        context.setProgress(20);

        fetchDataFromApi(`/api/category/id/${id}`).then((res) => {
            setcategory(res);
            setPreviews(res.images.map((item) => item.imageUrl));
            setUploadedImageIds(res.images.map((item) => {
                return {
                    id: item.id,
                    url: item.imageUrl
                }
            }))
            setFormFields({
                name: res.name,
                color: res.color
            });
            context.setProgress(100);
        });
    }, []);


    const changeInput = (e) => {
        setFormFields(() => (
            {
                ...formFields,
                [e.target.name]: e.target.value
            }
        ))
    }


    let selectedImages=[];
    const onChangeFile = async (e, apiEndPoint) => {
        try {
            const files = e.target.files;
            setUploading(true);
            for (var i = 0; i < files.length; i++) {
                if (files[i] && (files[i].type === 'image/jpeg' || files[i].type === 'image/jpg' || files[i].type === 'image/png' || files[i].type === 'image/webp')) {
                    const file = files[i];
                    selectedImages.push(file)
                    formdata.append(`images`, file);
                } else {
                    context.setAlertBox({
                        open: true,
                        error: true,
                        msg: 'Please select a valid JPG or PNG image file.'
                    });

                    return false;
                }
            }
            formFields.images=selectedImages;
        } catch (error) {
            console.error(error)
        }

        uploadImage(apiEndPoint, formdata).then((response) => {
            if (response !== undefined && response !== null && response !== "") {
                let _images = []
                for (const image of response) {
                    _images.push(image.imageUrl)
                }
                let uniqueArray = _images.filter((item, index) => _images.indexOf(item) === index);

                console.log(response)
                const newIds = response.map((image) => {
                    return {
                        id: image.id,
                        url: image.imageUrl
                    }
                })

                setUploadedImageIds([
                    ...uploadedImageIds,
                    ...newIds
                ])

                setPreviews([...previews, ...uniqueArray])

                setTimeout(() => {
                    setUploading(false);
                    context.setAlertBox({
                        open: true,
                        error: false,
                        msg: "Images Uploaded!"
                    })
                }, 200);
            }
        });
    }

    const removeImg = async (index, imgUrl) => {
        const imgIndex = previews.indexOf(imgUrl);

        const id = uploadedImageIds.filter((item) => item.url == imgUrl)[0].id

        if (id) {
            deleteData(`/api/image-upload/${id}`).then((res) => {
                if (imgIndex > -1) {
                    setUploadedImageIds(uploadedImageIds.filter((item) => item.id != id))
                    setPreviews(previews.filter((_, i) => i != imgIndex))
                }
            })
        } else {
            console.error("cannot delete image")
        }
    }


    const editCat = (e) => {
        e.preventDefault();

        formdata.append('name', formFields.name);
        formdata.append('color', formFields.color);
        formdata.append('images', previews);

        formFields.images = uploadedImageIds.map((item) => item.id)

        console.log(formdata)
        if (formFields.name !== "" && formFields.color !== "" && previews.length !== 0) {
            setIsLoading(true);

            editData(`/api/category/${id}`, formFields).then((res) => {
                setIsLoading(false);
                context.fetchCategory();
                context.fetchSubCategory();

                history('/category');
            });

        }

        else {
            context.setAlertBox({
                open: true,
                error: true,
                msg: 'Please fill all the details'
            });
            return false;
        }

    }

    return (
        <>
        <div className="right-content w-100">
        <div className="card shadow border-0 w-100 flex-row p-4 mt-2">
        <h5 className="mb-0">Edit Category</h5>
        <Breadcrumbs aria-label="breadcrumb" className="ml-auto breadcrumbs_">
        <StyledBreadcrumb
        component="a"
        href="#"
        label="Dashboard"
        icon={<HomeIcon fontSize="small" />}
        />

        <StyledBreadcrumb
        component="a"
        label="Category"
        href="#"
        deleteIcon={<ExpandMoreIcon />}
        />
        <StyledBreadcrumb
        label="Edit Category"
        deleteIcon={<ExpandMoreIcon />}
        />
        </Breadcrumbs>
        </div>

        <form className='form' onSubmit={editCat}>
        <div className='row'>
        <div className='col-sm-9'>
        <div className='card p-4 mt-0'>

        <div className='form-group'>
        <h6>Category Name</h6>
        <input type='text' name='name' value={formFields.name} onChange={changeInput} />
        </div>



        <div className='form-group'>
        <h6>Color</h6>
        <input type='text' name='color' value={formFields.color} onChange={changeInput} />
        </div>



        <div className="imagesUploadSec">
        <h5 class="mb-4">Media And Published</h5>



        <div className='imgUploadBox d-flex align-items-center'>

        {
            previews?.length !== 0 && previews?.map((img, index) => {
                return (
                    <div className='uploadBox' key={index}>
                    <span className="remove" onClick={() => removeImg(index, img)}><IoCloseSharp /></span>
                    <div className='box'>
                    <LazyLoadImage
                    alt={"image"}
                    effect="blur"
                    className="w-100"
                    src={img} />
                    </div>
                    </div>
                )
            })
        }



        <div className='uploadBox'>
        {
            uploading === true ?
            <div className="progressBar text-center d-flex align-items-center justify-content-center flex-column">
            <CircularProgress />
            <span>Uploading...</span>
            </div>
            :

            <>
            <input type="file" multiple onChange={(e) => onChangeFile(e, '/api/image-upload/upload')} name="images" />
            <div className='info'>
            <FaRegImages />
            <h5>image upload</h5>
            </div>
            </>

        }

        </div>


        </div>

        <br />

        <Button type="submit" className="btn-blue btn-lg btn-big w-100"
        ><FaCloudUploadAlt /> &nbsp;  {isLoading === true ? <CircularProgress color="inherit" className="loader" /> : 'PUBLISH AND VIEW'}  </Button>
        </div>

        </div>
        </div>


        </div>
        </form>

        </div>
        </>
    )
}

export default EditCategory;
