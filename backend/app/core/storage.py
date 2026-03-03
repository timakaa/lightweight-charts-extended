"""
MinIO object storage manager for file uploads
"""
import os
from io import BytesIO
from typing import Optional
from minio import Minio
from minio.error import S3Error


class StorageManager:
    """MinIO storage manager with singleton pattern"""

    _instance = None

    def __new__(cls):
        """Singleton pattern to ensure one MinIO connection"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        """Initialize MinIO connection (only once)"""
        if self._initialized:
            return

        self.client = self._initialize_minio()
        self.bucket_name = "charts"
        self._ensure_bucket_exists()
        self._initialized = True

    def _initialize_minio(self) -> Minio:
        """Initialize MinIO client"""
        endpoint = os.getenv("MINIO_ENDPOINT", "localhost:9000")
        access_key = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
        secret_key = os.getenv("MINIO_SECRET_KEY", "minioadmin123")
        secure = os.getenv("MINIO_SECURE", "false").lower() == "true"

        try:
            client = Minio(
                endpoint,
                access_key=access_key,
                secret_key=secret_key,
                secure=secure,
            )
            # Test connection
            client.list_buckets()
            print(f"✓ Connected to MinIO at {endpoint}")
            return client
        except Exception as e:
            print(f"✗ MinIO connection failed: {e}")
            raise RuntimeError(
                f"Failed to connect to MinIO at {endpoint}. "
                "Please ensure MinIO is running and credentials are correct."
            )

    def _ensure_bucket_exists(self) -> None:
        """Create bucket if it doesn't exist"""
        try:
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                print(f"✓ Created bucket: {self.bucket_name}")
            else:
                print(f"✓ Bucket exists: {self.bucket_name}")
        except S3Error as e:
            print(f"✗ Error creating bucket: {e}")
            raise

    def upload_file(
        self, object_name: str, data: bytes, content_type: str = "application/octet-stream"
    ) -> bool:
        """
        Upload file to MinIO
        
        Args:
            object_name: Name of the object (e.g., "backtest_123.png")
            data: File data as bytes
            content_type: MIME type (e.g., "image/png")
            
        Returns:
            True if successful, False otherwise
        """
        try:
            data_stream = BytesIO(data)
            self.client.put_object(
                self.bucket_name,
                object_name,
                data_stream,
                length=len(data),
                content_type=content_type,
            )
            print(f"✓ Uploaded: {object_name}")
            return True
        except S3Error as e:
            print(f"✗ Upload failed for {object_name}: {e}")
            return False

    def download_file(self, object_name: str) -> Optional[bytes]:
        """
        Download file from MinIO
        
        Args:
            object_name: Name of the object
            
        Returns:
            File data as bytes, or None if not found
        """
        try:
            response = self.client.get_object(self.bucket_name, object_name)
            data = response.read()
            response.close()
            response.release_conn()
            return data
        except S3Error as e:
            print(f"✗ Download failed for {object_name}: {e}")
            return None

    def delete_file(self, object_name: str) -> bool:
        """
        Delete file from MinIO
        
        Args:
            object_name: Name of the object
            
        Returns:
            True if successful, False otherwise
        """
        try:
            self.client.remove_object(self.bucket_name, object_name)
            print(f"✓ Deleted: {object_name}")
            return True
        except S3Error as e:
            print(f"✗ Delete failed for {object_name}: {e}")
            return False

    def file_exists(self, object_name: str) -> bool:
        """
        Check if file exists in MinIO
        
        Args:
            object_name: Name of the object
            
        Returns:
            True if exists, False otherwise
        """
        try:
            self.client.stat_object(self.bucket_name, object_name)
            return True
        except S3Error:
            return False

    def get_file_url(self, object_name: str) -> str:
        """
        Get public URL for a file (if bucket is public)
        For private buckets, use presigned URLs instead
        
        Args:
            object_name: Name of the object
            
        Returns:
            URL string
        """
        endpoint = os.getenv("MINIO_ENDPOINT", "localhost:9000")
        secure = os.getenv("MINIO_SECURE", "false").lower() == "true"
        protocol = "https" if secure else "http"
        return f"{protocol}://{endpoint}/{self.bucket_name}/{object_name}"

    def get_presigned_url(self, object_name: str, expires_seconds: int = 3600) -> Optional[str]:
        """
        Get presigned URL for temporary access
        
        Args:
            object_name: Name of the object
            expires_seconds: URL expiration time in seconds (default: 1 hour)
            
        Returns:
            Presigned URL string, or None on error
        """
        try:
            from datetime import timedelta
            url = self.client.presigned_get_object(
                self.bucket_name,
                object_name,
                expires=timedelta(seconds=expires_seconds),
            )
            return url
        except S3Error as e:
            print(f"✗ Failed to generate presigned URL for {object_name}: {e}")
            return None


# Global storage instance
storage = StorageManager()
