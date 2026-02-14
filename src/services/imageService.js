import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

const PICKER_OPTIONS = {
  quality: 0.7,
  allowsEditing: false,
  mediaTypes: ['images'],
  exif: false,
};

/**
 * Launch the camera and return a local image URI.
 * Returns null if cancelled or permission denied.
 */
export async function pickFromCamera() {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return null;

    const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    if (result.canceled || !result.assets?.length) return null;
    return result.assets[0].uri;
  } catch {
    return null;
  }
}

/**
 * Launch the photo library and return a local image URI.
 * Returns null if cancelled or permission denied.
 */
export async function pickFromGallery() {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return null;

    const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (result.canceled || !result.assets?.length) return null;
    return result.assets[0].uri;
  } catch {
    return null;
  }
}

/**
 * Upload a local image URI to Firebase Storage.
 * Returns the public download URL, or null on failure.
 *
 * @param {string} uri - local file URI
 * @param {string} storagePath - e.g. "users/{uid}/photos/abc.jpg"
 */
export async function uploadImage(uri, storagePath) {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  } catch {
    return null;
  }
}
