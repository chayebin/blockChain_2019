pragma solidity ^0.5.0;

contract Document
{
    struct FileDetails
    {
        uint timestamp;
        address owner;
    }
    mapping (string => FileDetails) files;
    event logFileAddedStatus(bool status, uint timestamp, address owner, string fileHash);
    
    //this is used to store the owner of file at the block
    function set(string memory fileHash) public
    {
        if(files[fileHash].timestamp == 0)
        {
            files[fileHash] = FileDetails(block.timestamp, msg.sender);
            emit logFileAddedStatus(true, block.timestamp, msg.sender, fileHash);
        }
        else
        {
            emit logFileAddedStatus(false, block.timestamp, msg.sender, fileHash);
        }
    }
    //this is used to get file information
    function get(string memory fileHash) public view returns (uint timestamp, address owner)
    {
        return (files[fileHash].timestamp, files[fileHash].owner);
    }
}
